import type { MetadataRoute } from "next";
import { BASE_PATH, DESCRIPTION, NAME } from "@/lib/site";

// public/ assets are served under basePath, but manifest icon `src` values are
// emitted verbatim — so they need the prefix applied by hand.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NAME,
    short_name: NAME,
    description: DESCRIPTION,
    start_url: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#030712",
    theme_color: "#030712",
    icons: [
      { src: `${BASE_PATH}/icon-192.png`, sizes: "192x192", type: "image/png" },
    ],
  };
}
