"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptSecret, hashToken } from "./aiCrypto";

function previewKey(apiKey: string) {
  return `****${apiKey.slice(-4)}`;
}

export const saveProviderKey = action({
  args: {
    sessionToken: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.apiKey.trim();
    if (trimmed.length < 24) {
      throw new Error("Invalid provider API key.");
    }

    await ctx.runMutation(internal.aiSettings.saveEncryptedKey, {
      sessionToken: args.sessionToken,
      tokenHash: hashToken(args.sessionToken),
      encryptedApiKey: encryptSecret(trimmed),
      apiKeyPreview: previewKey(trimmed),
    });

    return { apiKeyPreview: previewKey(trimmed) };
  },
});
