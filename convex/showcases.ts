import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/* ── Admin auth (same pattern as admin.ts) ── */

async function assertAdmin(ctx: MutationCtx | QueryCtx, token: string) {
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session || session.expiresAt < Date.now()) {
    throw new ConvexError("Admin session expired");
  }
}

/* ── Public queries ── */

/** Get a single active showcase by slug (for the visitor-facing iframe page). */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("projectShowcases")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!doc || !doc.isActive) return null;
    return doc;
  },
});

/** List all active showcases (for resume links). */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("projectShowcases")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    return docs.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/* ── Admin queries ── */

/** List ALL showcases for admin management. */
export const listAll = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const docs = await ctx.db.query("projectShowcases").collect();
    return docs.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/* ── Admin mutations ── */

/** Create or update a showcase entry. */
export const upsert = mutation({
  args: {
    adminToken: v.string(),
    id: v.optional(v.id("projectShowcases")),
    slug: v.string(),
    name: v.string(),
    url: v.string(),
    description: v.string(),
    stack: v.string(),
    thumbnailUrl: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(args.slug)) {
      throw new ConvexError("Slug must be lowercase alphanumeric with hyphens only");
    }

    // Validate URL
    if (!args.url.startsWith("https://")) {
      throw new ConvexError("URL must start with https://");
    }

    // Check for duplicate slug
    const existing = await ctx.db
      .query("projectShowcases")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing && (!args.id || existing._id !== args.id)) {
      throw new ConvexError("Slug already in use");
    }

    const now = Date.now();
    const data = {
      slug: args.slug,
      name: args.name,
      url: args.url,
      description: args.description,
      stack: args.stack,
      thumbnailUrl: args.thumbnailUrl,
      sortOrder: args.sortOrder,
      isActive: args.isActive,
      updatedAt: now,
    };

    if (args.id) {
      await ctx.db.patch(args.id, data);
      return args.id;
    } else {
      return await ctx.db.insert("projectShowcases", {
        ...data,
        createdAt: now,
      });
    }
  },
});

/** Toggle a showcase's active status. */
export const toggleActive = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("projectShowcases"),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new ConvexError("Showcase not found");
    await ctx.db.patch(args.id, {
      isActive: !doc.isActive,
      updatedAt: Date.now(),
    });
  },
});

/** Delete a showcase permanently. */
export const remove = mutation({
  args: {
    adminToken: v.string(),
    id: v.id("projectShowcases"),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new ConvexError("Showcase not found");
    await ctx.db.delete(args.id);
  },
});
