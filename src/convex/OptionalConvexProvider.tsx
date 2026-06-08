import type { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim();
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export const isConvexConfigured = Boolean(convexClient);

export function OptionalConvexProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  if (!convexClient) return <>{children}</>;
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}

