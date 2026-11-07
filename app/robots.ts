import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/admin/acceso"] },
    sitemap: "https://dolce-reposteria.vercel.app/sitemap.xml",
  };
}
