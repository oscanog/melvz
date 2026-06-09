"use node";

import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { decryptSecret, hashToken } from "./aiCrypto";
import type { Id } from "./_generated/dataModel";

type ProviderUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type ProviderMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readUsage(payload: unknown): Required<ProviderUsage> {
  const usage = asRecord(asRecord(payload).usage);
  return {
    prompt_tokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : 0,
    completion_tokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : 0,
    total_tokens: typeof usage.total_tokens === "number" ? usage.total_tokens : 0,
  };
}

function readContent(payload: unknown) {
  const root = asRecord(payload);
  const choices = Array.isArray(root.choices) ? root.choices : [];
  const first = asRecord(choices[0]);
  const message = asRecord(first.message);
  const content = typeof message.content === "string" ? message.content.trim() : "";
  return {
    content: content || "I could not produce a useful answer. Try asking about Melvin's projects, skills, or work history.",
    usage: readUsage(payload),
  };
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function systemPrompt(portfolioContext: string, memoryContext: string) {
  return [
    "You are Melvin Nogoy's portfolio assistant.",
    "Answer only from the provided portfolio, resume, project, skill, contact, and game context.",
    "Be concise, useful, and recruiter-friendly.",
    "If the user asks for private data, secrets, salary, references, or anything not present in context, say the portfolio does not provide that information.",
    "If the user asks how to contact Melvin, use only public contact links in the context.",
    "If the user asks about a project or skill, mention the relevant project, experience, or skill group by name.",
    "Do not invent dates, employers, metrics, credentials, or claims.",
    memoryContext ? `Conversation memory:\n${memoryContext}` : "",
    `Portfolio context:\n${portfolioContext}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const sendMessage = action({
  args: {
    threadId: v.optional(v.id("aiChatThreads")),
    clientThreadKey: v.string(),
    message: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    threadId: Id<"aiChatThreads">;
    content: string;
    model: string;
  }> => {
    const message = args.message.trim();
    if (!message) {
      throw new ConvexError("Message is required.");
    }
    if (message.length > 2000) {
      throw new ConvexError("Message is too long.");
    }
    if (args.clientThreadKey.trim().length < 12) {
      throw new ConvexError("Chat session is invalid.");
    }

    const visitorKeyHash = hashToken(args.clientThreadKey.trim());
    const settings = await ctx.runQuery(internal.aiSettings.getSettingsForAction, {});
    if (!settings.isEnabled || !settings.showPublicChat) {
      throw new ConvexError("AI chat is disabled.");
    }
    if (!settings.encryptedApiKey) {
      throw new ConvexError("AI chat is missing provider key.");
    }

    const dailyUsage = await ctx.runQuery(internal.aiSettings.getUsageWindow, {
      visitorKeyHash,
      since: startOfToday(),
      limit: settings.dailyAnonymousMessageLimit + 20,
    });
    if (dailyUsage.messageCount >= settings.dailyAnonymousMessageLimit) {
      await ctx.runMutation(internal.aiSettings.saveBlockedUsage, {
        visitorKeyHash,
        provider: settings.provider,
        model: settings.defaultModel,
      });
      throw new ConvexError("Daily AI message limit reached.");
    }

    const threadId: Id<"aiChatThreads"> = await ctx.runMutation(
      internal.aiSettings.createUserMessage,
      {
        visitorKeyHash,
        threadId: args.threadId,
        content: message,
      },
    );

    const recentMessages = await ctx.runQuery(internal.aiSettings.getRecentMessages, {
      visitorKeyHash,
      threadId,
      limit: 14,
    });
    const memory = await ctx.runQuery(internal.aiSettings.getThreadMemory, {
      visitorKeyHash,
      threadId,
    });
    const portfolioContext = await ctx.runQuery(internal.aiContext.getPortfolioContextForAction, {});

    const memoryContext = [
      memory.threadSummary ? `Thread summary: ${memory.threadSummary}` : "",
      memory.lastToolResults ? `Recent answer facts:\n${memory.lastToolResults}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const providerMessages: ProviderMessage[] = [
      {
        role: "system",
        content: systemPrompt(portfolioContext, memoryContext),
      },
      ...recentMessages
        .filter((entry) => entry.role === "user" || entry.role === "assistant")
        .map((entry) => ({
          role: entry.role as "user" | "assistant",
          content: entry.content,
        })),
    ];

    const apiKey = decryptSecret(settings.encryptedApiKey);
    const response = await fetch(`${settings.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: settings.defaultModel,
        messages: providerMessages,
        temperature: settings.temperature,
        max_tokens: settings.maxOutputTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new ConvexError(`Provider request failed (${response.status}) ${body.slice(0, 180)}`);
    }

    const result = readContent(await response.json());
    await ctx.runMutation(internal.aiSettings.saveAssistantMessage, {
      visitorKeyHash,
      threadId,
      content: result.content,
      model: settings.defaultModel,
      provider: settings.provider,
      inputTokens: result.usage.prompt_tokens,
      outputTokens: result.usage.completion_tokens,
      totalTokens: result.usage.total_tokens,
    });

    return {
      threadId,
      content: result.content,
      model: settings.defaultModel,
    };
  },
});
