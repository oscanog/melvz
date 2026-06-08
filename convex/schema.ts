import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  portfolio: defineTable({
    key: v.string(),
    content: v.any(),
    imageStorageId: v.optional(v.id("_storage")),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_key", ["key"]),
  adminSessions: defineTable({
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),
});

