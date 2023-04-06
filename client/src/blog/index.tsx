import { Route, Routes } from "react-router-dom";
import { HydrationData } from "../../../libs/types/hydration";
import { MainContentContainer } from "../ui/atoms/page-content";
import { TopNavigation } from "../ui/organisms/top-navigation";
import { BlogPost } from "./post";
import useSWR from "swr";
import type { BlogMetadata } from "../../../libs/types/blog";

export function Blog(appProps: HydrationData) {
  return (
    <Routes>
      <Route path="/" element={<BlogIndex {...appProps} />} />
      <Route path="/*" element={<BlogPost {...appProps} />} />
    </Routes>
  );
}

function BlogIndex(appProps: HydrationData) {
  const { data: posts } = useSWR<BlogMetadata[]>(
    "/en-US/blog.json",
    async (key) => {
      const res = await fetch(key);
      return await res.json();
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
                <a href={post.mdn_url}>{post.title}</a>
              </li>
            ))}
          </ul>
        </div>
      </MainContentContainer>
    </>
  );
}
