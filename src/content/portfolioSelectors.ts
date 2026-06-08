import type { ZoneConfig } from "../game/data/svZones";
import { fallbackPortfolio } from "./fallbackPortfolio";
import type { PortfolioContent } from "./portfolioTypes";

export function withPortfolioImageUrl(
  content: PortfolioContent,
  imageUrl?: string | null,
  imageBlurUrl?: string | null,
  image2xUrl?: string | null
): PortfolioContent {
  if (!imageUrl && !imageBlurUrl && !image2xUrl) return content;
  return {
    ...content,
    profile: {
      ...content.profile,
      ...(imageUrl ? { imageUrl } : {}),
      ...(image2xUrl ? { image2xUrl } : {}),
      ...(imageBlurUrl ? { imageBlurUrl } : {}),
    },
  };
}

export function normalizePortfolioContent(value: unknown): PortfolioContent {
  if (!value || typeof value !== "object") return fallbackPortfolio;
  const candidate = value as Partial<PortfolioContent>;
  if (!candidate.profile || !candidate.game?.zones) return fallbackPortfolio;
  return candidate as PortfolioContent;
}

export function getZoneMap(content: PortfolioContent): Record<string, ZoneConfig> {
  return Object.fromEntries(
    content.game.zones.map((zone) => [zone.id, zone as ZoneConfig])
  );
}
