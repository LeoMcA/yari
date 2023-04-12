import path from "node:path";
import fs from "node:fs/promises";
import { findAll } from "../content/document.js";
import { BUILD_OUT_ROOT, CONTENT_BLOG_ROOT } from "../libs/env/index.js";
import { BlogFrontmatter, BlogMetadata, BlogPost } from "../libs/types/blog.js";
import { RawDoc } from "../libs/types/document.js";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { renderHTML } from "../ssr/dist/main.js";
import { DEFAULT_LOCALE } from "../libs/constants/index.js";
import { HydrationData } from "../libs/types/hydration.js";

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

async function gatherRawBlogPosts() {
  if (!CONTENT_BLOG_ROOT) return [];
  return (
    [
      ...(await findAll({ roots: [CONTENT_BLOG_ROOT] })).iterDocs(),
    ] as RawDoc<BlogFrontmatter>[]
  ).sort((a, b) => Date.parse(b.metadata.date) - Date.parse(a.metadata.date));
}

export async function buildBlogHomepageContext(): Promise<
  HydrationData<BlogFrontmatter[]>
> {
  const rawPosts = await gatherRawBlogPosts();
  return {
    hyData: rawPosts.map(
      ({ metadata: { title, description, date, author, slug } }) => ({
        title,
        description,
        date,
        author,
        slug,
      })
    ),
  };
}

export async function buildBlogHomepage({ json }: { json: boolean }) {
  const context = await buildBlogHomepageContext();

  const html = renderHTML("/en-US/blog/", context);
  const outPath = path.join(
    BUILD_OUT_ROOT,
    DEFAULT_LOCALE.toLowerCase(),
    "blog"
  );
  await fs.mkdir(outPath, { recursive: true });
  const filePath = path.join(outPath, "index.html");
  await fs.writeFile(filePath, html);

  if (json) {
    const filePathContext = path.join(outPath, "index.json");
    await fs.writeFile(filePathContext, JSON.stringify(context));
  }
}
