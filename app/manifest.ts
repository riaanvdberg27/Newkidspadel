import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NextGen Padel Academy",
    short_name: "NextGen Padel",
    description: "Kids padel coaching in Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein and more — for ages 4–17.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1C3F",
    theme_color: "#0B1C3F",
    icons: [
      { src: "/images/mk-padel-logo.png", sizes: "192x192", type: "image/png" },
      { src: "/images/mk-padel-logo.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
