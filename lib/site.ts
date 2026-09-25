/** Sub-path the app is served from behind the proxy. Consumed by next.config.ts and app/manifest.ts. */
export const BASE_PATH = "/projects/ballcomp/app";

/**
 * Absolute origin, used to build absolute OG/Twitter image URLs.
 * Set NEXT_PUBLIC_SITE_URL in the deploy environment; the fallback is dev-only.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
