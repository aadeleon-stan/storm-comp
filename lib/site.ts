/** Sub-path the app is served from behind the proxy. Consumed by next.config.ts and app/manifest.ts. */
export const BASE_PATH = "/projects/balldiff/app";

/**
 * Absolute origin, used to build absolute OG/Twitter image URLs.
 * Set NEXT_PUBLIC_SITE_URL in the deploy environment; the fallback is dev-only.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Product name. Single source of truth for the wordmark, page titles, and the OG card. */
export const NAME = "balldiff";

/** Shared by the page metadata, the web manifest, and the OG card subhead. */
export const DESCRIPTION =
  "Compare Storm bowling ball reaction specs side by side — hook length, ball shape, and lane condition for every ball in your arsenal.";
