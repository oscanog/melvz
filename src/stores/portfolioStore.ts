import { atom } from "jotai";
import { fallbackPortfolio } from "../content/fallbackPortfolio";
import type { PortfolioContent } from "../content/portfolioTypes";

export const portfolioContentAtom = atom<PortfolioContent>(fallbackPortfolio);

