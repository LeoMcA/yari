import { Route, Routes } from "react-router-dom";
import { HydrationData } from "../../../libs/types/hydration";
import { MainContentContainer } from "../ui/atoms/page-content";
import { TopNavigation } from "../ui/organisms/top-navigation";
import { BlogPost } from "./post";
import useSWR from "swr";
import type { BlogFrontmatter } from "../../../libs/types/blog";

export function Blog(appProps: HydrationData) {
  return (
    <Routes>
      <Route path="/" element={<BlogIndex {...appProps} />} />
      <Route path="/*" element={<BlogPost {...appProps} />} />
    </Routes>
  );
}

function BlogIndex(appProps: HydrationData) {
  const { data: posts } = useSWR<BlogFrontmatter[]>(
    "/en-US/blog/index.json",
    async (key) => {
      const res = await fetch(key);
      return (await res.json()).hyData;
    }
  );

  return (
    <>
      <div className="main-document-header-container">
        <TopNavigation />
      </div>
      <MainContentContainer>
        <div className="main-page-content">
          <h1>Blog</h1>
          <ul>
            {posts?.map((post) => (
              <li>
                <a href={"/en-US/blog/" + post.slug}>{post.title}</a>
              </li>
            ))}
          </ul>
        </div>
      </MainContentContainer>
    </>
  );
}
