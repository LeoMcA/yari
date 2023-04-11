import { Doc, DocMetadata, RawDoc } from "./document.js";

export function isBlog(doc: RawDoc<any>): doc is RawDoc<BlogFrontmatter> {
  return doc.isBlog;
}

export interface BlogFrontmatter {
  title: string;
  slug: string;
  description: string;
  image?: string;
  date: string;
  author?: string;
  tags?: string[];
}

export interface BlogMetadata extends DocMetadata {
  description: string;
  image: string;
  date: string;
  author?: string;
}

export type BlogPost = Doc & BlogMetadata;
