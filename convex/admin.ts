import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { defaultPortfolio } from "./defaultPortfolio";

const PORTFOLIO_KEY = "main";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

type ImageSnapshot = {
  imageStorageId?: Id<"_storage">;
  imageBlurStorageId?: Id<"_storage">;
  imageDisplay2xStorageId?: Id<"_storage">;
  imageArchiveStorageId?: Id<"_storage">;
};

type PortfolioDocLike = Partial<ImageSnapshot> & {
  content: unknown;
};
type RevisionKind = "save" | "image" | "rollback";
type RevisionListDoc = {
  _id: Id<"portfolioRevisions">;
  message: string;
  kind: RevisionKind;
  createdAt: number;
  createdBy?: string;
  parentRevisionId?: Id<"portfolioRevisions">;
  restoredFromRevisionId?: Id<"portfolioRevisions">;
};
type RevisionDoc = Doc<"portfolioRevisions">;

async function assertAdmin(ctx: MutationCtx | QueryCtx, token: string) {
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session || session.expiresAt < Date.now()) {
    throw new ConvexError("Admin session expired");
  }
}

function imageSnapshotFrom(doc: Partial<ImageSnapshot> | null | undefined): ImageSnapshot {
  return {
    ...(doc?.imageStorageId ? { imageStorageId: doc.imageStorageId } : {}),
    ...(doc?.imageBlurStorageId ? { imageBlurStorageId: doc.imageBlurStorageId } : {}),
    ...(doc?.imageDisplay2xStorageId ? { imageDisplay2xStorageId: doc.imageDisplay2xStorageId } : {}),
    ...(doc?.imageArchiveStorageId ? { imageArchiveStorageId: doc.imageArchiveStorageId } : {}),
  };
}

function publicRevision(doc: RevisionListDoc) {
  return {
    _id: doc._id,
    shortHash: doc._id.slice(-7),
    message: doc.message,
    kind: doc.kind,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy ?? "admin",
    ...(doc.parentRevisionId
      ? {
          parentRevisionId: doc.parentRevisionId,
          parentShortHash: doc.parentRevisionId.slice(-7),
        }
      : {}),
    ...(doc.restoredFromRevisionId
      ? {
          restoredFromRevisionId: doc.restoredFromRevisionId,
          restoredFromShortHash: doc.restoredFromRevisionId.slice(-7),
        }
      : {}),
  };
}

async function getLatestRevision(ctx: QueryCtx | MutationCtx) {
  const revisions = await ctx.db
    .query("portfolioRevisions")
    .withIndex("by_key_and_createdAt", (q) => q.eq("key", PORTFOLIO_KEY))
    .order("desc")
    .take(1);
  return revisions[0] ?? null;
}

async function getPreviousRevision(ctx: QueryCtx, revision: RevisionDoc) {
  if (revision.parentRevisionId) {
    const parent = await ctx.db.get(revision.parentRevisionId);
    if (parent && parent.key === PORTFOLIO_KEY) return parent;
  }

  const previous = await ctx.db
    .query("portfolioRevisions")
    .withIndex("by_key_and_createdAt", (q) =>
      q.eq("key", PORTFOLIO_KEY).lt("createdAt", revision.createdAt)
    )
    .order("desc")
    .take(1);
  return previous[0] ?? null;
}

async function createRevision(
  ctx: MutationCtx,
  snapshot: PortfolioDocLike,
  kind: RevisionKind,
  message: string,
  restoredFromRevisionId?: Id<"portfolioRevisions">
) {
  const parentRevision = await getLatestRevision(ctx);
  await ctx.db.insert("portfolioRevisions", {
    key: PORTFOLIO_KEY,
    content: snapshot.content,
    ...imageSnapshotFrom(snapshot),
    kind,
    message,
    createdAt: Date.now(),
    createdBy: "admin",
    ...(parentRevision ? { parentRevisionId: parentRevision._id } : {}),
    ...(restoredFromRevisionId ? { restoredFromRevisionId } : {}),
  });
}

function stableForJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableForJson);
  if (!value || typeof value !== "object") return value;

  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = stableForJson((value as Record<string, unknown>)[key]);
  }
  return sorted;
}

function stablePrettyJson(value: unknown) {
  return JSON.stringify(stableForJson(value), null, 2);
}

function imageFileSnapshot(doc: Partial<ImageSnapshot> | null | undefined) {
  return stableForJson(imageSnapshotFrom(doc));
}

function lineStats(oldText: string, newText: string) {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const max = Math.max(oldLines.length, newLines.length);
  let additions = 0;
  let deletions = 0;

  for (let index = 0; index < max; index += 1) {
    if (oldLines[index] === newLines[index]) continue;
    if (oldLines[index] !== undefined) deletions += 1;
    if (newLines[index] !== undefined) additions += 1;
  }

  return { additions, deletions };
}

function virtualFile(name: string, oldValue: unknown, newValue: unknown) {
  const oldText = stablePrettyJson(oldValue);
  const newText = stablePrettyJson(newValue);
  const stats = lineStats(oldText, newText);
  return {
    name,
    oldText,
    newText,
    changed: oldText !== newText,
    additions: stats.additions,
    deletions: stats.deletions,
  };
}

async function upsertPortfolio(
  ctx: MutationCtx,
  content: unknown,
  images?: ImageSnapshot
) {
  const existing = await ctx.db
    .query("portfolio")
    .withIndex("by_key", (q) => q.eq("key", PORTFOLIO_KEY))
    .unique();

  const nextImages = images ?? imageSnapshotFrom(existing);
  const nextDoc = {
    key: PORTFOLIO_KEY,
    content,
    updatedAt: Date.now(),
    updatedBy: "admin",
    ...nextImages,
  };

  if (existing) {
    await ctx.db.replace(existing._id, nextDoc);
    return { id: existing._id, content, ...nextImages };
  }

  const id = await ctx.db.insert("portfolio", nextDoc);
  return { id, content, ...nextImages };
}

export const createSession = mutation({
  args: { passcode: v.string() },
  handler: async (ctx, args) => {
    const expected = process.env.ADMIN_PASSCODE;
    if (!expected) throw new ConvexError("ADMIN_PASSCODE is not configured");
    if (args.passcode !== expected) throw new ConvexError("Invalid passcode");

    const token = crypto.randomUUID();
    const now = Date.now();
    await ctx.db.insert("adminSessions", {
      token,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });

    return { token, expiresAt: now + SESSION_TTL_MS };
  },
});

export const validateSession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .unique();

    if (!session || session.expiresAt < Date.now()) return { ok: false };
    return { ok: true, expiresAt: session.expiresAt };
  },
});

export const updatePortfolio = mutation({
  args: {
    sessionToken: v.string(),
    content: v.any(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    const message = args.message.trim();
    if (!message) throw new ConvexError("Save message is required");

    const snapshot = await upsertPortfolio(ctx, args.content);
    await createRevision(ctx, snapshot, "save", message);
    return { ok: true };
  },
});

export const listHistory = query({
  args: {
    sessionToken: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    const page = await ctx.db
      .query("portfolioRevisions")
      .withIndex("by_key_and_createdAt", (q) => q.eq("key", PORTFOLIO_KEY))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...page,
      page: page.page.map(publicRevision),
    };
  },
});

export const getRevisionDetail = query({
  args: {
    sessionToken: v.string(),
    revisionId: v.id("portfolioRevisions"),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    const revision = await ctx.db.get(args.revisionId);
    if (!revision || revision.key !== PORTFOLIO_KEY) {
      throw new ConvexError("Revision not found");
    }

    const parent = await getPreviousRevision(ctx, revision);
    const files = [
      virtualFile(
        "resume-content.json",
        parent?.content ?? null,
        revision.content
      ),
      virtualFile(
        "profile-image.json",
        imageFileSnapshot(parent),
        imageFileSnapshot(revision)
      ),
    ].filter((file) => file.changed);

    return {
      revision: publicRevision(revision),
      parent: parent ? publicRevision(parent) : null,
      files,
      changedFileCount: files.length,
      totalAdditions: files.reduce((total, file) => total + file.additions, 0),
      totalDeletions: files.reduce((total, file) => total + file.deletions, 0),
    };
  },
});

export const generateProfileImageUploadUrl = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    return {
      displayUploadUrl: await ctx.storage.generateUploadUrl(),
      display2xUploadUrl: await ctx.storage.generateUploadUrl(),
      blurUploadUrl: await ctx.storage.generateUploadUrl(),
      archiveUploadUrl: await ctx.storage.generateUploadUrl(),
    };
  },
});

export const setProfileImage = mutation({
  args: {
    sessionToken: v.string(),
    storageId: v.id("_storage"),
    blurStorageId: v.id("_storage"),
    display2xStorageId: v.id("_storage"),
    archiveStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    const existing = await ctx.db
      .query("portfolio")
      .withIndex("by_key", (q) => q.eq("key", PORTFOLIO_KEY))
      .unique();

    const snapshot = await upsertPortfolio(ctx, existing?.content ?? defaultPortfolio, {
      imageStorageId: args.storageId,
      imageBlurStorageId: args.blurStorageId,
      imageDisplay2xStorageId: args.display2xStorageId,
      imageArchiveStorageId: args.archiveStorageId,
    });
    await createRevision(ctx, snapshot, "image", "Update profile image");

    return {
      ok: true,
      profileImageUrl: await ctx.storage.getUrl(args.storageId),
      profileImage2xUrl: await ctx.storage.getUrl(args.display2xStorageId),
      profileImageBlurUrl: await ctx.storage.getUrl(args.blurStorageId),
    };
  },
});

export const rollbackPortfolio = mutation({
  args: {
    sessionToken: v.string(),
    revisionId: v.id("portfolioRevisions"),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    const revision = await ctx.db.get(args.revisionId);
    if (!revision || revision.key !== PORTFOLIO_KEY) {
      throw new ConvexError("Revision not found");
    }

    const snapshot = await upsertPortfolio(ctx, revision.content, imageSnapshotFrom(revision));
    await createRevision(
      ctx,
      snapshot,
      "rollback",
      `Rollback to ${revision._id.slice(-7)}`,
      revision._id
    );

    return {
      ok: true,
      content: revision.content,
      profileImageUrl: snapshot.imageStorageId
        ? await ctx.storage.getUrl(snapshot.imageStorageId)
        : null,
      profileImage2xUrl: snapshot.imageDisplay2xStorageId
        ? await ctx.storage.getUrl(snapshot.imageDisplay2xStorageId)
        : null,
      profileImageBlurUrl: snapshot.imageBlurStorageId
        ? await ctx.storage.getUrl(snapshot.imageBlurStorageId)
        : null,
    };
  },
});
