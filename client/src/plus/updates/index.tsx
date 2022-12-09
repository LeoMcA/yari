import Container from "../../ui/atoms/container";

import "./index.scss";
import { Icon } from "../../ui/atoms/icon";
import BrowserCompatibilityTable from "../../document/ingredients/browser-compatibility-table";
import { useLocale } from "../../hooks";
import Mandala from "../../ui/molecules/mandala";
import { browserToIconName } from "../../document/ingredients/browser-compatibility-table/headers";
import useSWR from "swr";
import { DocMetadata } from "../../../../libs/types/document";
import BookmarkMenu from "../../ui/organisms/article-actions/bookmark-menu";
import { NotificationsWatchMenu } from "../../ui/organisms/article-actions/notifications-watch-menu";
import { Button } from "../../ui/atoms/button";
import { useState } from "react";
import { Group, Event, useBCD, useUpdates, GroupType } from "./api";
import { camelWrap } from "../../utils";
import LoadMore from "../../ui/molecules/load-more";
import { Loading } from "../../ui/atoms/loading";
import { useUserData } from "../../user-context";

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
  const { data, setSize, error, isLoading, atEnd } = useUpdates();

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
        {data ? (
          <>
            {data.flat(1).map((group) => (
              <GroupComponent key={group.id} group={group} />
            ))}
            <LoadMore
              atEnd={atEnd}
              setSize={setSize}
              loading={isLoading}
              error={error}
            />
          </>
        ) : (
          <Loading />
        )}
      </Container>
    </div>
  );
}

function GroupComponent({ group }: { group: Group }) {
  const { type, date, events } = group;
  const browser = "browser" in group ? group.browser : null;
  const metadata = browser
    ? {
        icon: browserToIconName(browser.browser),
        title: `${browser.name} ${browser.version}`,
      }
    : type === GroupType.Subfeatures
    ? {
        icon: "star",
        title: "Subfeatures added",
      }
    : type === GroupType.NonNull
    ? {
        icon: "add",
        title: "Added missing compatibility data",
      }
    : null;

  return metadata ? (
    <div className="group">
      <header>
        <Icon name={metadata.icon} />
        {metadata.title}
        {browser && (
          <span className="number-badge">
            {events.length} {events.length === 1 ? "update" : "updates"}
          </span>
        )}
        <time dateTime={date}>
          {new Date(date).toLocaleDateString(undefined, {
            dateStyle: "medium",
          })}
        </time>
      </header>
      {events.map((event) => (
        <ItemComponent key={event.id} event={event} />
      ))}
    </div>
  ) : null;
}

function ItemComponent({ event }: { event: Event }) {
  const [isOpen, setIsOpen] = useState(false);
  const category = event.path.split(".")[0];
  return (
    <details
      className={`category-${category}`}
      onToggle={({ target }) =>
        target instanceof HTMLDetailsElement && setIsOpen(target.open)
      }
    >
      <summary>
        <code>{camelWrap(event.path.split(".").slice(1).join("."))}</code>
        <i>{CATEGORY_TO_NAME[category]}</i>
        {EVENT_TO_VERB[event.event]}
        <Icon name="chevron" />
      </summary>
      {isOpen && <ItemInnerComponent event={event} />}
    </details>
  );
}

function ItemInnerComponent({ event: { path, mdn_url } }: { event: Event }) {
  const locale = useLocale() || "en-US";
  const { data } = useBCD(path);
  return (
    <div>
      <ArticleActions mdn_url={mdn_url} />
      {data && (
        <BrowserCompatibilityTable
          query={path}
          data={data.data}
          browsers={data.browsers}
          locale={locale}
        />
      )}
    </div>
  );
}

function ArticleActions({ mdn_url }: { mdn_url?: string }) {
  const userData = useUserData();
  const url = mdn_url?.replace("https://developer.mozilla.org", "/en-US");
  const { data: doc } = useSWR<DocMetadata>(
    () => userData?.isAuthenticated && url && `${url}/metadata.json`,
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

  return url ? (
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
