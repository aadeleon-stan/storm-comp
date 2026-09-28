/** Sub-path the app is served from behind the proxy. Consumed by next.config.ts and app/manifest.ts. */
export const BASE_PATH = "/projects/balldiff/app";

/**
 * Absolute origin, used to build absolute OG/Twitter image URLs.
 *
 * Defaults to the canonical public origin rather than localhost: these URLs are
 * only ever fetched by link-preview crawlers running on someone else's servers,
 * so a localhost default silently yields an unreachable og:image in production.
 * Override with NEXT_PUBLIC_SITE_URL for preview deploys.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.antondeleon.com";

/** Product name. Single source of truth for the wordmark, page titles, and the OG card. */
export const NAME = "balldiff";

/** Shared by the page metadata, the web manifest, and the OG card subhead. */
export const DESCRIPTION =
  "Compare Storm bowling ball reaction specs side by side — hook length, ball shape, and lane condition for every ball in your arsenal.";
