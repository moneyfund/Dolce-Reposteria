import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://dolce-reposteria.vercel.app/", changeFrequency: "weekly", priority: 1 },
    { url: "https://dolce-reposteria.vercel.app/legales", changeFrequency: "monthly", priority: 0.4 },
  ];
}
