"use node";

import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { decryptSecret, hashToken } from "./aiCrypto";
import type { Id } from "./_generated/dataModel";

/* ── Tool definitions for admin portfolio editing ── */

const PORTFOLIO_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "proposeProfileEdit",
      description:
        "Propose editing the resume profile fields: name, title, summary, or contacts. Always describe what will change.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["edit"] },
          fields: {
            type: "object",
            properties: {
              name: { type: "string" },
              title: { type: "string" },
              summary: { type: "string" },
              contacts: { type: "array", items: { type: "string" } },
            },
          },
          description: { type: "string", description: "Human-readable summary of what changes" },
        },
        required: ["action", "fields", "description"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "proposeSkillsEdit",
      description:
        "Propose adding, editing, or removing skill groups. Provide the full replacement skills array.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["add", "edit", "delete"] },
          skills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                items: { type: "array", items: { type: "string" } },
              },
              required: ["label", "items"],
            },
          },
          description: { type: "string" },
        },
        required: ["action", "skills", "description"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "proposeEducationEdit",
      description:
        "Propose adding, editing, or removing education entries. Provide the full replacement education array.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["add", "edit", "delete"] },
          education: {
            type: "array",
            items: {
              type: "object",
              properties: {
                degree: { type: "string" },
                school: { type: "string" },
                period: { type: "string" },
                detail: { type: "string" },
              },
              required: ["degree", "school", "period", "detail"],
            },
          },
          description: { type: "string" },
        },
        required: ["action", "education", "description"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "proposeExperienceEdit",
      description:
        "Propose adding, editing, or removing experience entries. Provide the full replacement experiences array.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["add", "edit", "delete"] },
          experiences: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role: { type: "string" },
                period: { type: "string" },
                description: { type: "string" },
              },
              required: ["role", "period", "description"],
            },
          },
          description: { type: "string" },
        },
        required: ["action", "experiences", "description"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "proposeProjectEdit",
      description:
        "Propose adding, editing, or removing projects. Provide the full replacement featured and compact project arrays.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["add", "edit", "delete"] },
          featured: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                period: { type: "string" },
                stack: { type: "string" },
                description: { type: "string" },
              },
              required: ["name", "period", "stack", "description"],
            },
          },
          compact: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                period: { type: "string" },
                stack: { type: "string" },
                description: { type: "string" },
              },
              required: ["name", "period", "stack", "description"],
            },
          },
          description: { type: "string" },
        },
        required: ["action", "featured", "compact", "description"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "proposeSocialsEdit",
      description:
        "Propose adding, editing, or removing social links. Provide the full replacement socials array.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["add", "edit", "delete"] },
          socials: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                url: { type: "string" },
                address: { type: "string" },
              },
              required: ["name", "description"],
            },
          },
          description: { type: "string" },
        },
        required: ["action", "socials", "description"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "proposeGameZoneEdit",
      description:
        "Propose adding, editing, or removing game zones. Provide the full replacement zones array.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["add", "edit", "delete"] },
          zones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                index: { type: "number" },
                year: { type: "string" },
                role: { type: "string" },
                kiss: { type: "string" },
                workLevel: { type: "number" },
                skyPhase: { type: "string", enum: ["dawn", "noon", "golden", "night"] },
                buildingLabel: { type: "string" },
                projects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      stack: { type: "string" },
                      color: { type: "array", items: { type: "number" } },
                    },
                    required: ["name", "stack", "color"],
                  },
                },
                left: { type: "string" },
                right: { type: "string" },
              },
              required: ["id", "index", "year", "role", "kiss", "workLevel", "skyPhase", "buildingLabel", "projects"],
            },
          },
          description: { type: "string" },
        },
        required: ["action", "zones", "description"],
      },
    },
  },
];

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

function adminSystemPrompt(portfolioContext: string, memoryContext: string) {
  return [
    "You are Melvin Nogoy's portfolio editor assistant. The user is an authenticated admin.",
    "You can help the admin edit the portfolio by calling the proposal tools.",
    "IMPORTANT RULES:",
    "1. When the admin asks to add, edit, update, or delete portfolio content, use the appropriate propose* tool.",
    "2. ALWAYS describe what you will change BEFORE calling the tool. Explain the change in your text response.",
    "3. Each tool takes the FULL replacement array for that section. Include ALL existing items plus your changes.",
    "4. For profile edits, only include fields that are changing in the fields object.",
    "5. Never auto-apply changes. The admin will see a confirmation card and must click Apply.",
    "6. If the admin asks to delete items, warn them about what will be removed.",
    "7. If the admin asks to delete ALL items in a section, add an extra warning.",
    "8. You can also answer normal portfolio questions without using tools.",
    "9. Do not invent data. Ask the admin for details if the request is ambiguous.",
    "10. Keep existing data intact when adding new items — always include current items in the array.",
    memoryContext ? `Conversation memory:\n${memoryContext}` : "",
    `Current portfolio content:\n${portfolioContext}`,
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
        .filter((entry: { role: string; content: string }) => entry.role === "user" || entry.role === "assistant")
        .map((entry: { role: string; content: string }) => ({
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

/* ── Admin message with tool-calling for portfolio editing ── */

type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

function readToolCalls(payload: unknown): ToolCall[] {
  const root = asRecord(payload);
  const choices = Array.isArray(root.choices) ? root.choices : [];
  const first = asRecord(choices[0]);
  const message = asRecord(first.message);
  const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  return toolCalls.map((tc: unknown) => {
    const call = asRecord(tc);
    const fn = asRecord(call.function);
    return {
      id: typeof call.id === "string" ? call.id : "",
      type: "function" as const,
      function: {
        name: typeof fn.name === "string" ? fn.name : "",
        arguments: typeof fn.arguments === "string" ? fn.arguments : "{}",
      },
    };
  });
}

function readContentWithToolCalls(payload: unknown) {
  const root = asRecord(payload);
  const choices = Array.isArray(root.choices) ? root.choices : [];
  const first = asRecord(choices[0]);
  const message = asRecord(first.message);
  const content = typeof message.content === "string" ? message.content.trim() : "";
  const finishReason = typeof first.finish_reason === "string" ? first.finish_reason : "";
  const toolCalls = readToolCalls(payload);
  return {
    content,
    toolCalls,
    finishReason,
    usage: readUsage(payload),
  };
}

type ProposalPayload = {
  toolName: string;
  action: string;
  section: string;
  description: string;
  data: Record<string, unknown>;
};

function parseProposal(toolCall: ToolCall): ProposalPayload | null {
  try {
    const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
    const name = toolCall.function.name;
    const action = typeof args.action === "string" ? args.action : "edit";
    const description = typeof args.description === "string" ? args.description : "";

    const sectionMap: Record<string, string> = {
      proposeProfileEdit: "profile",
      proposeSkillsEdit: "skills",
      proposeEducationEdit: "education",
      proposeExperienceEdit: "experiences",
      proposeProjectEdit: "projects",
      proposeSocialsEdit: "socials",
      proposeGameZoneEdit: "game.zones",
    };
    const section = sectionMap[name];
    if (!section) return null;

    return { toolName: name, action, section, description, data: args };
  } catch {
    return null;
  }
}

export const sendAdminMessage = action({
  args: {
    sessionToken: v.string(),
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
    proposals: ProposalPayload[];
  }> => {
    const message = args.message.trim();
    if (!message) throw new ConvexError("Message is required.");
    if (message.length > 2000) throw new ConvexError("Message is too long.");
    if (args.clientThreadKey.trim().length < 12) throw new ConvexError("Chat session is invalid.");

    // Validate admin session server-side
    const isAdmin: boolean = await ctx.runQuery(internal.aiSettings.validateAdminSession, {
      sessionToken: args.sessionToken,
    });
    if (!isAdmin) throw new ConvexError("Admin session expired.");

    const visitorKeyHash = hashToken(args.clientThreadKey.trim());
    const settings = await ctx.runQuery(internal.aiSettings.getSettingsForAction, {});
    if (!settings.isEnabled) throw new ConvexError("AI chat is disabled.");
    if (!settings.encryptedApiKey) throw new ConvexError("AI chat is missing provider key.");

    // Use admin daily limit
    const dailyUsage = await ctx.runQuery(internal.aiSettings.getUsageWindow, {
      visitorKeyHash,
      since: startOfToday(),
      limit: settings.dailyAdminMessageLimit + 20,
    });
    if (dailyUsage.messageCount >= settings.dailyAdminMessageLimit) {
      await ctx.runMutation(internal.aiSettings.saveBlockedUsage, {
        visitorKeyHash,
        provider: settings.provider,
        model: settings.defaultModel,
      });
      throw new ConvexError("Daily admin AI message limit reached.");
    }

    const threadId: Id<"aiChatThreads"> = await ctx.runMutation(
      internal.aiSettings.createUserMessage,
      { visitorKeyHash, threadId: args.threadId, content: message },
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
        content: adminSystemPrompt(portfolioContext, memoryContext),
      },
      ...recentMessages
        .filter((entry: { role: string; content: string }) => entry.role === "user" || entry.role === "assistant")
        .map((entry: { role: string; content: string }) => ({
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
        tools: PORTFOLIO_TOOLS,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new ConvexError(`Provider request failed (${response.status}) ${body.slice(0, 180)}`);
    }

    const parsed = readContentWithToolCalls(await response.json());
    const proposals: ProposalPayload[] = [];

    for (const tc of parsed.toolCalls) {
      const proposal = parseProposal(tc);
      if (proposal) proposals.push(proposal);
    }

    const textContent = parsed.content || (proposals.length > 0
      ? `I have a proposal to ${proposals[0].action} the ${proposals[0].section} section.`
      : "I could not produce a useful answer. Try asking about editing your portfolio.");

    // Include proposal summaries in stored message
    const storedContent = proposals.length > 0
      ? `${textContent}\n\n[Proposal: ${proposals.map((p) => p.description).join("; ")}]`
      : textContent;

    await ctx.runMutation(internal.aiSettings.saveAssistantMessage, {
      visitorKeyHash,
      threadId,
      content: storedContent,
      model: settings.defaultModel,
      provider: settings.provider,
      inputTokens: parsed.usage.prompt_tokens,
      outputTokens: parsed.usage.completion_tokens,
      totalTokens: parsed.usage.total_tokens,
    });

    return {
      threadId,
      content: textContent,
      model: settings.defaultModel,
      proposals,
    };
  },
});

/* ── Chat session history ── */

type ThreadSummary = {
  _id: Id<"aiChatThreads">;
  title: string;
  createdAt: number;
  updatedAt: number;
};

type ThreadMessage = {
  role: "user" | "assistant";
  content: string;
  model?: string;
  createdAt: number;
};

export const listChatSessions = action({
  args: {
    clientThreadKey: v.string(),
  },
  handler: async (ctx, args): Promise<ThreadSummary[]> => {
    const key = args.clientThreadKey.trim();
    if (key.length < 12) throw new ConvexError("Chat session is invalid.");
    const visitorKeyHash = hashToken(key);
    return await ctx.runQuery(internal.aiSettings.listVisitorThreads, {
      visitorKeyHash,
      limit: 30,
    });
  },
});

export const loadChatSession = action({
  args: {
    clientThreadKey: v.string(),
    threadId: v.id("aiChatThreads"),
  },
  handler: async (ctx, args): Promise<ThreadMessage[]> => {
    const key = args.clientThreadKey.trim();
    if (key.length < 12) throw new ConvexError("Chat session is invalid.");
    const visitorKeyHash = hashToken(key);
    return await ctx.runQuery(internal.aiSettings.getVisitorThreadMessages, {
      visitorKeyHash,
      threadId: args.threadId,
    });
  },
});
