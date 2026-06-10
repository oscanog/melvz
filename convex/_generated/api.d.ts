/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addLuxuriousProject from "../addLuxuriousProject.js";
import type * as admin from "../admin.js";
import type * as aiAgent from "../aiAgent.js";
import type * as aiContext from "../aiContext.js";
import type * as aiCrypto from "../aiCrypto.js";
import type * as aiSecrets from "../aiSecrets.js";
import type * as aiSettings from "../aiSettings.js";
import type * as defaultPortfolio from "../defaultPortfolio.js";
import type * as portfolio from "../portfolio.js";
import type * as seed from "../seed.js";
import type * as seedMystery from "../seedMystery.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addLuxuriousProject: typeof addLuxuriousProject;
  admin: typeof admin;
  aiAgent: typeof aiAgent;
  aiContext: typeof aiContext;
  aiCrypto: typeof aiCrypto;
  aiSecrets: typeof aiSecrets;
  aiSettings: typeof aiSettings;
  defaultPortfolio: typeof defaultPortfolio;
  portfolio: typeof portfolio;
  seed: typeof seed;
  seedMystery: typeof seedMystery;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
