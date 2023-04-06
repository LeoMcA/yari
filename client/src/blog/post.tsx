import React from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import useSWR, { mutate } from "swr";

import { CRUD_MODE, PLACEMENT_ENABLED } from "../env";
import { useIsServer } from "../hooks";

import { useCopyExamplesToClipboard } from "../document/hooks";
import { Doc } from "../../../libs/types/document";

// Misc
// Sub-components
import { TopNavigation } from "../ui/organisms/top-navigation";
import { ArticleActionsContainer } from "../ui/organisms/article-actions-container";
import { LocalizedContentNote } from "../document/molecules/localized-content-note";
import { OfflineStatusBar } from "../ui/molecules/offline-status-bar";
import { TOC } from "../document/organisms/toc";
import { RenderSideBar } from "../document/organisms/sidebar";
import { RetiredLocaleNote } from "../document/molecules/retired-locale-note";
import { MainContentContainer } from "../ui/atoms/page-content";
import { Loading } from "../ui/atoms/loading";
import { PageNotFound } from "../page-not-found";

import "../document/index.scss";

// It's unfortunate but it is what it is at the moment. Not every page has an
// interactive example (in its HTML blob) but we don't know that in advance.
// But just in case it does, we need to have the CSS ready in the main bundle.
// Perhaps a more ideal solution would be that the interactive example <iframe>
// code could come with its own styling rather than it having to be part of the
// main bundle all the time.
import "../document/interactive-examples.scss";
import { useInteractiveExamplesActionHandler as useInteractiveExamplesTelemetry } from "../telemetry/interactive-examples";
import { Placement } from "../ui/organisms/placement";
import { HTTPError, LoadingError, RenderDocumentBody } from "../document";
import { HydrationData } from "../../../libs/types/hydration";

// Lazy sub-components
const Toolbar = React.lazy(() => import("../document/toolbar"));
const MathMLPolyfillMaybe = React.lazy(
  () => import("../document/mathml-polyfill")
);

function useBlogPostURL() {
  const { "*": slug, locale } = useParams();
  const url = `/${locale}/blog/${slug}`;
  // If you're in local development Express will force the trailing /
  // on any URL. We can't keep that if we're going to compare the current
  // pathname with the document's mdn_url.
  return url.endsWith("/") ? url.substring(0, url.length - 1) : url;
}

export function BlogPost(props: HydrationData) {
  const isServer = useIsServer();

  const blogPostURL = useBlogPostURL();
  const { locale = "en-US" } = useParams();
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const previousDoc = React.useRef(null);

  const fallbackData =
    props.doc && props.doc.mdn_url.toLowerCase() === blogPostURL.toLowerCase()
      ? props.doc
      : null;

  const dataURL = `${blogPostURL}/index.json`;
  const { data: doc, error } = useSWR<Doc>(
    dataURL,
    async (url) => {
      const response = await fetch(url);

      if (!response.ok) {
        switch (response.status) {
          case 404:
            throw new HTTPError(response.status, url, "Page not found");

          case 504:
            if (previousDoc.current) {
              return previousDoc.current;
            }
        }

        const text = await response.text();
        throw new HTTPError(response.status, url, text);
      }

      const { doc } = await response.json();
      previousDoc.current = doc;

      if (response.redirected) {
        navigate(doc.mdn_url);
      }

      return doc;
    },
    {
      fallbackData,
      revalidateOnFocus: CRUD_MODE,
      revalidateOnMount: !fallbackData,
      refreshInterval: CRUD_MODE ? 500 : 0,
    }
  );

  useCopyExamplesToClipboard(doc);
  useInteractiveExamplesTelemetry();

  React.useEffect(() => {
    if (!doc && !error) {
      document.title = "⏳ Loading…";
    } else if (error) {
      document.title = "💔 Loading error";
    } else if (doc) {
      document.title = doc.pageTitle;
    }
  }, [doc, error]);

  if (!doc && !error) {
    return <Loading minHeight={800} message="Loading document..." />;
  }

  if (error) {
    return (
      <>
        <div className="main-document-header-container">
          <TopNavigation />
        </div>
        <MainContentContainer>
          {error instanceof HTTPError && error.status === 404 ? (
            <PageNotFound />
          ) : (
            <LoadingError error={error} />
          )}
        </MainContentContainer>
      </>
    );
  }

  if (!doc) {
    return null;
  }

  const retiredLocale = searchParams.get("retiredLocale");

  return (
    <>
      <div className="main-document-header-container">
        <TopNavigation />
        <ArticleActionsContainer doc={doc} />
      </div>
      {/* only include this if we are not server-side rendering */}
      {!isServer && <OfflineStatusBar />}
      {doc.isTranslated ? (
        <div className="container">
          <LocalizedContentNote isActive={doc.isActive} locale={locale} />
        </div>
      ) : (
        retiredLocale && (
          <div className="container">
            <RetiredLocaleNote locale={retiredLocale} />
          </div>
        )
      )}
      <div className="main-wrapper">
        <div className="sidebar-container">
          <RenderSideBar doc={doc} />
          <div className="toc-container">
            <aside className="toc">
              <nav>{doc.toc && !!doc.toc.length && <TOC toc={doc.toc} />}</nav>
            </aside>
            {PLACEMENT_ENABLED && <Placement />}
          </div>
        </div>

        <MainContentContainer>
          {!isServer && CRUD_MODE && doc.isActive && (
            <React.Suspense fallback={<Loading message={"Loading toolbar"} />}>
              <Toolbar
                doc={doc}
                reloadPage={() => {
                  mutate(dataURL);
                }}
              />
            </React.Suspense>
          )}

          {!isServer && doc.hasMathML && (
            <React.Suspense fallback={null}>
              <MathMLPolyfillMaybe />
            </React.Suspense>
          )}
          <article className="main-page-content" lang={doc.locale}>
            <h1>{doc.title}</h1>
            <RenderDocumentBody doc={doc} />
          </article>
        </MainContentContainer>
      </div>
    </>
  );
}
