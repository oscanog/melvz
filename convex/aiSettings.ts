import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const SETTINGS_KEY = "default";

const DEFAULT_SETTINGS = {
  key: SETTINGS_KEY,
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  defaultModel: "deepseek-v4-flash",
  temperature: 0.4,
  maxOutputTokens: 900,
  dailyAnonymousMessageLimit: 30,
  dailyAdminMessageLimit: 80,
  monthlyTokenLimit: 250000,
  enabledScopes: ["resume", "projects", "skills", "experience", "contact", "game"],
  enabledSkills: ["general_chat", "resume_lookup"],
  isEnabled: true,
  showPublicChat: true,
};

const modelValidator = v.union(
  v.literal("deepseek-v4-flash"),
  v.literal("deepseek-v4-pro"),
);

async function assertAdmin(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session || session.expiresAt < Date.now()) {
    throw new ConvexError("Admin session expired");
  }
}

export const validateAdminSession = internalQuery({
  args: { sessionToken: v.string() },
  handler: async (ctx, args): Promise<boolean> => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .unique();
    return Boolean(session && session.expiresAt >= Date.now());
  },
});

async function readSettings(ctx: QueryCtx | MutationCtx) {
  return await ctx.db
    .query("aiSettings")
    .withIndex("by_key", (q) => q.eq("key", SETTINGS_KEY))
    .unique();
}

function safeSettings(settings: Awaited<ReturnType<typeof readSettings>>) {
  return {
    ...DEFAULT_SETTINGS,
    hasApiKey: Boolean(settings?.encryptedApiKey),
    apiKeyPreview: settings?.apiKeyPreview ?? null,
    apiKeyRotatedAt: settings?.apiKeyRotatedAt ?? null,
    provider: settings?.provider ?? DEFAULT_SETTINGS.provider,
    baseUrl: settings?.baseUrl ?? DEFAULT_SETTINGS.baseUrl,
    defaultModel: settings?.defaultModel ?? DEFAULT_SETTINGS.defaultModel,
    temperature: settings?.temperature ?? DEFAULT_SETTINGS.temperature,
    maxOutputTokens: settings?.maxOutputTokens ?? DEFAULT_SETTINGS.maxOutputTokens,
    dailyAnonymousMessageLimit:
      settings?.dailyAnonymousMessageLimit ?? DEFAULT_SETTINGS.dailyAnonymousMessageLimit,
    dailyAdminMessageLimit:
      settings?.dailyAdminMessageLimit ?? DEFAULT_SETTINGS.dailyAdminMessageLimit,
    monthlyTokenLimit: settings?.monthlyTokenLimit ?? DEFAULT_SETTINGS.monthlyTokenLimit,
    enabledScopes: settings?.enabledScopes ?? DEFAULT_SETTINGS.enabledScopes,
    enabledSkills: settings?.enabledSkills ?? DEFAULT_SETTINGS.enabledSkills,
    isEnabled: settings?.isEnabled ?? DEFAULT_SETTINGS.isEnabled,
    showPublicChat: settings?.showPublicChat ?? DEFAULT_SETTINGS.showPublicChat,
    updatedAt: settings?.updatedAt ?? null,
    updatedBy: settings?.updatedBy ?? null,
  };
}

export const getPublicSettings = query({
  args: {},
  handler: async (ctx) => {
    return safeSettings(await readSettings(ctx));
  },
});

export const getAdminSettings = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    return safeSettings(await readSettings(ctx));
  },
});

export const listAuditEvents = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    return await ctx.db
      .query("aiSettingsAuditEvents")
      .withIndex("by_createdAt")
      .order("desc")
      .take(Math.min(Math.max(args.limit ?? 10, 1), 50));
  },
});

export const updateSettings = mutation({
  args: {
    sessionToken: v.string(),
    defaultModel: modelValidator,
    temperature: v.number(),
    maxOutputTokens: v.number(),
    dailyAnonymousMessageLimit: v.number(),
    dailyAdminMessageLimit: v.number(),
    monthlyTokenLimit: v.number(),
    enabledScopes: v.array(v.string()),
    enabledSkills: v.array(v.string()),
    isEnabled: v.boolean(),
    showPublicChat: v.boolean(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    const now = Date.now();
    const settings = await readSettings(ctx);
    const patch = {
      provider: DEFAULT_SETTINGS.provider,
      baseUrl: DEFAULT_SETTINGS.baseUrl,
      defaultModel: args.defaultModel,
      temperature: Math.min(Math.max(args.temperature, 0), 2),
      maxOutputTokens: Math.min(Math.max(args.maxOutputTokens, 200), 4000),
      dailyAnonymousMessageLimit: Math.min(Math.max(args.dailyAnonymousMessageLimit, 1), 500),
      dailyAdminMessageLimit: Math.min(Math.max(args.dailyAdminMessageLimit, 1), 1000),
      monthlyTokenLimit: Math.min(Math.max(args.monthlyTokenLimit, 1000), 5000000),
      enabledScopes: args.enabledScopes.slice(0, 20),
      enabledSkills: args.enabledSkills.slice(0, 20),
      isEnabled: args.isEnabled,
      showPublicChat: args.showPublicChat,
      updatedAt: now,
      updatedBy: "admin",
    };

    if (settings) {
      await ctx.db.patch("aiSettings", settings._id, patch);
    } else {
      await ctx.db.insert("aiSettings", {
        key: SETTINGS_KEY,
        ...patch,
      });
    }

    await ctx.db.insert("aiSettingsAuditEvents", {
      adminSessionTokenHash: "passcode-admin",
      action: "settings.update",
      safeDetails: JSON.stringify({
        defaultModel: args.defaultModel,
        isEnabled: args.isEnabled,
        showPublicChat: args.showPublicChat,
      }),
      createdAt: now,
    });

    return { ok: true };
  },
});

export const getSettingsForAction = internalQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await readSettings(ctx);
    return {
      ...DEFAULT_SETTINGS,
      encryptedApiKey: settings?.encryptedApiKey ?? null,
      apiKeyPreview: settings?.apiKeyPreview ?? null,
      apiKeyRotatedAt: settings?.apiKeyRotatedAt ?? null,
      provider: settings?.provider ?? DEFAULT_SETTINGS.provider,
      baseUrl: settings?.baseUrl ?? DEFAULT_SETTINGS.baseUrl,
      defaultModel: settings?.defaultModel ?? DEFAULT_SETTINGS.defaultModel,
      temperature: settings?.temperature ?? DEFAULT_SETTINGS.temperature,
      maxOutputTokens: settings?.maxOutputTokens ?? DEFAULT_SETTINGS.maxOutputTokens,
      dailyAnonymousMessageLimit:
        settings?.dailyAnonymousMessageLimit ?? DEFAULT_SETTINGS.dailyAnonymousMessageLimit,
      dailyAdminMessageLimit:
        settings?.dailyAdminMessageLimit ?? DEFAULT_SETTINGS.dailyAdminMessageLimit,
      monthlyTokenLimit: settings?.monthlyTokenLimit ?? DEFAULT_SETTINGS.monthlyTokenLimit,
      enabledScopes: settings?.enabledScopes ?? DEFAULT_SETTINGS.enabledScopes,
      enabledSkills: settings?.enabledSkills ?? DEFAULT_SETTINGS.enabledSkills,
      isEnabled: settings?.isEnabled ?? DEFAULT_SETTINGS.isEnabled,
      showPublicChat: settings?.showPublicChat ?? DEFAULT_SETTINGS.showPublicChat,
    };
  },
});

export const saveEncryptedKey = internalMutation({
  args: {
    sessionToken: v.string(),
    tokenHash: v.string(),
    encryptedApiKey: v.string(),
    apiKeyPreview: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.sessionToken);
    const now = Date.now();
    const settings = await readSettings(ctx);
    const patch = {
      provider: DEFAULT_SETTINGS.provider,
      baseUrl: DEFAULT_SETTINGS.baseUrl,
      defaultModel: settings?.defaultModel ?? DEFAULT_SETTINGS.defaultModel,
      encryptedApiKey: args.encryptedApiKey,
      apiKeyPreview: args.apiKeyPreview,
      apiKeyRotatedAt: now,
      temperature: settings?.temperature ?? DEFAULT_SETTINGS.temperature,
      maxOutputTokens: settings?.maxOutputTokens ?? DEFAULT_SETTINGS.maxOutputTokens,
      dailyAnonymousMessageLimit:
        settings?.dailyAnonymousMessageLimit ?? DEFAULT_SETTINGS.dailyAnonymousMessageLimit,
      dailyAdminMessageLimit:
        settings?.dailyAdminMessageLimit ?? DEFAULT_SETTINGS.dailyAdminMessageLimit,
      monthlyTokenLimit: settings?.monthlyTokenLimit ?? DEFAULT_SETTINGS.monthlyTokenLimit,
      enabledScopes: settings?.enabledScopes ?? DEFAULT_SETTINGS.enabledScopes,
      enabledSkills: settings?.enabledSkills ?? DEFAULT_SETTINGS.enabledSkills,
      isEnabled: settings?.isEnabled ?? DEFAULT_SETTINGS.isEnabled,
      showPublicChat: settings?.showPublicChat ?? DEFAULT_SETTINGS.showPublicChat,
      updatedAt: now,
      updatedBy: "admin",
    };

    if (settings) {
      await ctx.db.patch("aiSettings", settings._id, patch);
    } else {
      await ctx.db.insert("aiSettings", {
        key: SETTINGS_KEY,
        ...patch,
      });
    }

    await ctx.db.insert("aiSettingsAuditEvents", {
      adminSessionTokenHash: args.tokenHash,
      action: "settings.key.rotate",
      safeDetails: JSON.stringify({ apiKeyPreview: args.apiKeyPreview }),
      createdAt: now,
    });
  },
});

export const updateThreadTitle = internalMutation({
  args: {
    threadId: v.id("aiChatThreads"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.threadId, {
      title: args.title.slice(0, 100), // Max 100 chars
    });
  },
});

export const createUserMessage = internalMutation({
  args: {
    visitorKeyHash: v.string(),
    threadId: v.optional(v.id("aiChatThreads")),
    content: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"aiChatThreads">> => {
    const now = Date.now();
    let threadId = args.threadId;

    if (threadId) {
      const thread = await ctx.db.get(threadId);
      if (!thread || thread.visitorKeyHash !== args.visitorKeyHash) {
        throw new ConvexError("Thread not found");
      }
      await ctx.db.patch(threadId, { updatedAt: now });
    } else {
      threadId = await ctx.db.insert("aiChatThreads", {
        visitorKeyHash: args.visitorKeyHash,
        title: args.content.slice(0, 64),
        threadSummary: "",
        activeScopes: [],
        activeEntities: [],
        lastIntent: "",
        lastToolResults: "",
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("aiChatMessages", {
      threadId,
      visitorKeyHash: args.visitorKeyHash,
      role: "user",
      content: args.content,
      createdAt: now,
    });

    return threadId;
  },
});

export const getRecentMessages = internalQuery({
  args: {
    visitorKeyHash: v.string(),
    threadId: v.id("aiChatThreads"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.visitorKeyHash !== args.visitorKeyHash) {
      throw new ConvexError("Thread not found");
    }

    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_threadId_and_createdAt", (q) => q.eq("threadId", args.threadId))
      .order("desc")
      .take(Math.min(Math.max(args.limit ?? 16, 1), 30));

    return messages.reverse().map((message) => ({
      role: message.role,
      content: message.content,
    }));
  },
});

export const getThreadMemory = internalQuery({
  args: {
    visitorKeyHash: v.string(),
    threadId: v.id("aiChatThreads"),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.visitorKeyHash !== args.visitorKeyHash) {
      throw new ConvexError("Thread not found");
    }
    return {
      threadSummary: thread.threadSummary,
      activeScopes: thread.activeScopes,
      activeEntities: thread.activeEntities,
      lastIntent: thread.lastIntent,
      lastToolResults: thread.lastToolResults,
    };
  },
});

export const saveAssistantMessage = internalMutation({
  args: {
    visitorKeyHash: v.string(),
    threadId: v.id("aiChatThreads"),
    content: v.string(),
    model: v.string(),
    provider: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    totalTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("aiChatMessages", {
      threadId: args.threadId,
      visitorKeyHash: args.visitorKeyHash,
      role: "assistant",
      content: args.content,
      model: args.model,
      provider: args.provider,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      totalTokens: args.totalTokens,
      createdAt: now,
    });
    await ctx.db.patch(args.threadId, {
      updatedAt: now,
      lastIntent: "resume_chat",
      lastToolResults: args.content.slice(0, 1200),
    });
    await ctx.db.insert("aiUsageEvents", {
      threadId: args.threadId,
      visitorKeyHash: args.visitorKeyHash,
      provider: args.provider,
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      status: "success",
      createdAt: now,
    });
  },
});

export const getUsageWindow = internalQuery({
  args: {
    visitorKeyHash: v.string(),
    since: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("aiUsageEvents")
      .withIndex("by_visitorKeyHash_and_createdAt", (q) => q.eq("visitorKeyHash", args.visitorKeyHash))
      .order("desc")
      .take(Math.min(Math.max(args.limit ?? 500, 1), 1000));

    return events
      .filter((event) => event.createdAt >= args.since)
      .reduce(
        (summary, event) => ({
          messageCount: summary.messageCount + (event.status === "success" ? 1 : 0),
          tokenCount: summary.tokenCount + event.inputTokens + event.outputTokens,
        }),
        { messageCount: 0, tokenCount: 0 },
      );
  },
});

export const saveBlockedUsage = internalMutation({
  args: {
    visitorKeyHash: v.string(),
    provider: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiUsageEvents", {
      visitorKeyHash: args.visitorKeyHash,
      provider: args.provider,
      model: args.model,
      inputTokens: 0,
      outputTokens: 0,
      status: "blocked",
      createdAt: Date.now(),
    });
  },
});

export const listVisitorThreads = internalQuery({
  args: {
    visitorKeyHash: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cap = Math.min(Math.max(args.limit ?? 30, 1), 50);
    const threads = await ctx.db
      .query("aiChatThreads")
      .withIndex("by_visitorKeyHash", (q) => q.eq("visitorKeyHash", args.visitorKeyHash))
      .order("desc")
      .take(cap);

    return threads.map((t) => ({
      _id: t._id,
      title: t.title,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  },
});

export const getVisitorThreadMessages = internalQuery({
  args: {
    visitorKeyHash: v.string(),
    threadId: v.id("aiChatThreads"),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.visitorKeyHash !== args.visitorKeyHash) {
      throw new ConvexError("Thread not found");
    }

    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_threadId_and_createdAt", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .take(200);

    return messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        model: m.model,
        createdAt: m.createdAt,
      }));
  },
});
