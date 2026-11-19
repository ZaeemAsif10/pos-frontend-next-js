/**
 * Site-wide configuration and metadata constants.
 */
import { env } from "./env";

export const siteConfig = {
  name: "Paperless",
  description: "Modern, scalable document and workflow management system.",
  links: {
    docs: "/docs",
    api: env.API_URL,
  },
} as const;

export type SiteConfig = typeof siteConfig;
