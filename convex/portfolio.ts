import { query } from "./_generated/server";

const PORTFOLIO_KEY = "main";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("portfolio")
      .withIndex("by_key", (q) => q.eq("key", PORTFOLIO_KEY))
      .unique();

    if (!doc) return null;

    const profileImageUrl = doc.imageStorageId
      ? await ctx.storage.getUrl(doc.imageStorageId)
      : null;
    const profileImageBlurUrl = doc.imageBlurStorageId
      ? await ctx.storage.getUrl(doc.imageBlurStorageId)
      : null;

    return {
      content: doc.content,
      profileImageUrl,
      profileImageBlurUrl,
      updatedAt: doc.updatedAt,
    };
  },
});
