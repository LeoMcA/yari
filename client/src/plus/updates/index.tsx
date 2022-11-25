import Container from "../../ui/atoms/container";
import bcd from "@mdn/browser-compat-data";
import type BCD from "@mdn/browser-compat-data/types";

import "./index.scss";
import { Icon } from "../../ui/atoms/icon";
import BrowserCompatibilityTable from "../../document/ingredients/browser-compatibility-table";
import { useLocale } from "../../hooks";
import Mandala from "../../ui/molecules/mandala";
import data from "./dummy-changes.json";
import { browserToIconName } from "../../document/ingredients/browser-compatibility-table/headers";
import useSWR from "swr";
import { DocMetadata } from "../../../../libs/types/document";
import BookmarkMenu from "../../ui/organisms/article-actions/bookmark-menu";
import { NotificationsWatchMenu } from "../../ui/organisms/article-actions/notifications-watch-menu";
import { Button } from "../../ui/atoms/button";

const CATEGORY_TO_NAME = {
  api: "Web APIs",
  css: "CSS",
  html: "HTML",
  http: "HTTP",
  javascript: "JavaScript",
  mathml: "MathML",
  svg: "SVG",
  webdriver: "WebDriver",
  webextensions: "Web Extensions",
};

const EVENT_TO_VERB = {
  added_stable: "support added",
  added_preview: "preview support added",
  removed_stable: "support removed",
};

export default function Updates() {
  return (
    <div className="updates">
      <header className="plus-header-mandala">
        <Container>
          <h1>
            <div className="mandala-icon-wrapper">
              <Mandala rotate={true} />
              <Icon name="bell-filled" />
            </div>
            <span>Updates</span>
          </h1>
          <p>
            Foobar foobar foobar
            <br />
            <a rel="noreferrer noopener" target="_blank" href="TODO">
              We'd love to hear your feedback!
            </a>
          </p>
        </Container>
      </header>
      <Container>
        {data
          .slice(0, 10)
          .reduce<typeof data[]>((acc, curr) => {
            const last = acc.pop();
            if (last) {
              if (
                last[0].event === curr.event ||
                (["added_stable", "removed_stable"].includes(last[0].event) &&
                  ["added_stable", "removed_stable"].includes(curr.event))
              ) {
                last.push(curr);
                acc.push(last);
              } else {
                acc.push(last);
                acc.push([curr]);
              }
            } else {
              acc.push([curr]);
            }
            return acc;
          }, [])
          .map((events) => {
            const type = events[0].event;
            if (
              ["added_stable", "removed_stable", "added_preview"].includes(type)
            ) {
              return (
                <>
                  {events
                    .reduce<typeof events[]>((acc, curr) => {
                      const exploded = curr?.browsers?.map((x) => ({
                        ...curr,
                        browsers: [x],
                      }));
                      exploded?.forEach((event) => {
                        const existing = acc.find(
                          (x) =>
                            x?.[0]?.browsers?.[0].browser ===
                            event.browsers[0].browser
                        );
                        if (existing) {
                          existing.push(event);
                        } else {
                          acc.push([event]);
                        }
                      });
                      return acc;
                    }, [])
                    .map((events) => (
                      <BrowserGroup events={events} />
                    ))}
                </>
              );
            } else if (type === "added_subfeatures") {
              return <SubfeaturesGroup events={events} />;
            } else if (type === "added_nonnull") {
              return <NonNullGroup events={events} />;
            }
          })}
      </Container>
    </div>
  );
}

function BrowserGroup({ events }) {
  const browser = events[0].browsers?.[0];
  const releaseDate =
    bcd.browsers[browser.browser].releases[browser.version].release_date;
  return (
    <div className="group">
      <header>
        <BrowserIconName browser={browser} />
        <span className="number-badge">
          {events.length} {events.length === 1 ? "update" : "updates"}
        </span>
        {releaseDate && (
          <time dateTime={releaseDate}>
            {new Date(releaseDate).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </time>
        )}
      </header>
      {events.map((event) => (
        <Item event={event} />
      ))}
    </div>
  );
}

function BrowserIconName({
  browser,
}: {
  browser:
    | {
        browser: string;
        version: string;
      }
    | undefined;
}) {
  return browser ? (
    <>
      <Icon name={browserToIconName(browser.browser)} />
      {`${bcd.browsers[browser.browser].name} ${browser.version}`}
    </>
  ) : null;
}

function SubfeaturesGroup({ events }) {
  return (
    <div className="group">
      <header>
        <Icon name="star" />
        Subfeatures added
      </header>
      {events.map((event) => (
        <Item event={event} />
      ))}
    </div>
  );
}

function NonNullGroup({ events }) {
  return (
    <div className="group">
      <header>
        <Icon name="add" />
        Added missing compatibility data
      </header>
      {events.map((event) => (
        <Item event={event} />
      ))}
    </div>
  );
}

function Item({ event: { event, path, mdn_url } }) {
  const locale = useLocale() || "en-US";
  const data = path
    .split(".")
    .reduce((prev, curr) => prev[curr], bcd) as unknown as BCD.Identifier;
  const category = path.split(".")[0];
  return (
    <details className={`category-${category}`}>
      <summary>
        <code>{path.split(".").slice(1).join(".")}</code>
        <i>{CATEGORY_TO_NAME[category]}</i>
        {EVENT_TO_VERB[event]}
        <Icon name="chevron" />
      </summary>
      <div>
        <ArticleActions mdn_url={mdn_url} />
        <BrowserCompatibilityTable
          query={path}
          data={data}
          browsers={bcd.browsers}
          locale={locale}
        />
      </div>
    </details>
  );
}

function ArticleActions({ mdn_url }: { mdn_url?: string }) {
  const url = mdn_url?.replace("https://developer.mozilla.org", "/en-US");
  const { data: doc } = useSWR<DocMetadata>(
    () => url && `${url}/metadata.json`,
    async (url) => {
      const response = await fetch(url);

      if (!response.ok) {
        throw Error(response.statusText);
      }

      return (await response.json()) as DocMetadata;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return doc ? (
    <nav>
      <Button
        type="action"
        icon="external"
        size="small"
        href={url}
        extraClasses="link-button"
      >
        See full article
      </Button>
      <NotificationsWatchMenu doc={doc} />
      <BookmarkMenu doc={doc} />
    </nav>
  ) : null;
}
