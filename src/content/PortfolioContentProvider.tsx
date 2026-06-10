import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useSetAtom } from "jotai";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { isConvexConfigured } from "../convex/OptionalConvexProvider";
import { portfolioContentAtom } from "../stores/portfolioStore";
import { fallbackPortfolio } from "./fallbackPortfolio";
import {
  normalizePortfolioContent,
  withPortfolioImageUrl,
} from "./portfolioSelectors";
import type { PortfolioContent } from "./portfolioTypes";

interface PortfolioContentValue {
  content: PortfolioContent;
  source: "fallback" | "convex";
  loading: boolean;
}

const PortfolioContentContext = createContext<PortfolioContentValue>({
  content: fallbackPortfolio,
  source: "fallback",
  loading: false,
});

export function PortfolioContentProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  if (!isConvexConfigured) {
    return <StaticPortfolioContentProvider>{children}</StaticPortfolioContentProvider>;
  }
  return <ConvexPortfolioContentProvider>{children}</ConvexPortfolioContentProvider>;
}

function StaticPortfolioContentProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const setPortfolioContent = useSetAtom(portfolioContentAtom);

  useEffect(() => {
    setPortfolioContent(fallbackPortfolio);
  }, [setPortfolioContent]);

  return (
    <PortfolioContentContext.Provider
      value={{ content: fallbackPortfolio, source: "fallback", loading: false }}
    >
      {children}
    </PortfolioContentContext.Provider>
  );
}

function ConvexPortfolioContentProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const remote = useQuery(api.portfolio.get);
  const setPortfolioContent = useSetAtom(portfolioContentAtom);

  const content = useMemo(() => {
    if (!remote?.content) return fallbackPortfolio;
    return withPortfolioImageUrl(
      normalizePortfolioContent(remote.content),
      remote.profileImageUrl,
      remote.profileImageBlurUrl,
      remote.profileImage2xUrl
    );
  }, [remote]);

  useEffect(() => {
    setPortfolioContent(content);
  }, [content, setPortfolioContent]);

  return (
    <PortfolioContentContext.Provider
      value={{
        content,
        source: remote?.content ? "convex" : "fallback",
        loading: remote === undefined,
      }}
    >
      {children}
    </PortfolioContentContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePortfolioContent(): PortfolioContentValue {
  return useContext(PortfolioContentContext);
}
