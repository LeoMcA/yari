import { BlogMetadata } from "../libs/types/blog.js";

export function addBlogMetadata(document: any): Partial<BlogMetadata> {
  const isBlog = document.isBlog;
  let metadata: Partial<BlogMetadata> = {
    isBlog,
  };
  if (isBlog) {
    const { description, image, date, author } = document.metadata;
    metadata = {
      ...metadata,
      description,
      image,
      date,
      author,
    };
  }
  return metadata;
}
