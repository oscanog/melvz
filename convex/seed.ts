import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { defaultPortfolio } from "./defaultPortfolio";

const PORTFOLIO_KEY = "main";

export const portfolio = mutation({
  args: { adminPasscode: v.string() },
  handler: async (ctx, args) => {
    const expected = process.env.ADMIN_PASSCODE;
    if (!expected) throw new ConvexError("ADMIN_PASSCODE is not configured");
    if (args.adminPasscode !== expected) throw new ConvexError("Invalid passcode");

    const existing = await ctx.db
      .query("portfolio")
      .withIndex("by_key", (q) => q.eq("key", PORTFOLIO_KEY))
      .unique();

    const patch = {
      content: defaultPortfolio,
      updatedAt: Date.now(),
      updatedBy: "seed",
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return { ok: true, action: "updated" };
    }

    await ctx.db.insert("portfolio", {
      key: PORTFOLIO_KEY,
      ...patch,
    });
    return { ok: true, action: "inserted" };
  },
});

