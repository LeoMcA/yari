import { Doc, DocMetadata } from "./document.js";

export interface BlogFrontmatter {
  title: string;
  slug: string;
  description: string;
  image?: string;
  date: string;
  author?: string;
}

export interface BlogMetadata extends DocMetadata {
  description: string;
  image: string;
  date: string;
  author?: string;
}

export type BlogPost = Doc & BlogMetadata;
