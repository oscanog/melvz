import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { defaultPortfolio } from "./defaultPortfolio";

const PORTFOLIO_KEY = "main";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

async function assertAdmin(ctx: MutationCtx, token: string) {
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session || session.expiresAt < Date.now()) {
    throw new ConvexError("Admin session expired");
  }
}

async function upsertPortfolio(
  ctx: MutationCtx,
  content: unknown,
  imageStorageId?: Id<"_storage">,
  imageBlurStorageId?: Id<"_storage">
) {
  const existing = await ctx.db
    .query("portfolio")
    .withIndex("by_key", (q) => q.eq("key", PORTFOLIO_KEY))
    .unique();

  const patch = {
    content,
    updatedAt: Date.now(),
    updatedBy: "admin",
    ...(imageStorageId ? { imageStorageId } : {}),
    ...(imageBlurStorageId ? { imageBlurStorageId } : {}),
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
    return existing._id;
  }

  return await ctx.db.insert("portfolio", {
    key: PORTFOLIO_KEY,
    ...patch,
  });
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

export const updatePortfolio = mutation({
  args: {
    sessionToken: v.string(),
    content: v.any(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    await upsertPortfolio(ctx, args.content);
    return { ok: true };
  },
});

export const generateProfileImageUploadUrl = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    return {
      fullUploadUrl: await ctx.storage.generateUploadUrl(),
      blurUploadUrl: await ctx.storage.generateUploadUrl(),
    };
  },
});

export const setProfileImage = mutation({
  args: {
    sessionToken: v.string(),
    storageId: v.id("_storage"),
    blurStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    const existing = await ctx.db
      .query("portfolio")
      .withIndex("by_key", (q) => q.eq("key", PORTFOLIO_KEY))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        imageStorageId: args.storageId,
        imageBlurStorageId: args.blurStorageId,
        updatedAt: Date.now(),
        updatedBy: "admin",
      });
    } else {
      await upsertPortfolio(ctx, defaultPortfolio, args.storageId, args.blurStorageId);
    }

    return {
      ok: true,
      profileImageUrl: await ctx.storage.getUrl(args.storageId),
      profileImageBlurUrl: await ctx.storage.getUrl(args.blurStorageId),
    };
  },
});
