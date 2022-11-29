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
import {
  BrowserGroup,
  Event,
  Group,
  GroupType,
  useBCD,
  useUpdates,
} from "./api";
import { camelWrap } from "../../utils";

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
  const { data } = useUpdates();
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
        {data?.map((group) => (
          <GenericGroup group={group} />
        ))}
      </Container>
    </div>
  );
}

function GenericGroup({ group }: { group: Group | BrowserGroup }) {
  switch (group.type) {
    case GroupType.Browser:
      return <BrowserGroupComponent group={group as BrowserGroup} />;
    case GroupType.Subfeatures:
      return <SubfeaturesGroup group={group} />;
    case GroupType.NonNull:
      return <NonNullGroup group={group} />;
    default:
      return null;
  }
}

function BrowserGroupComponent({
  group: { browser, events },
}: {
  group: BrowserGroup;
}) {
  return (
    <div className="group">
      <header>
        <Icon name={browserToIconName(browser.browser)} />
        {`${browser.name} ${browser.version}`}
        <span className="number-badge">
          {events.length} {events.length === 1 ? "update" : "updates"}
        </span>
        {browser.releaseDate && (
          <time dateTime={browser.releaseDate}>
            {new Date(browser.releaseDate).toLocaleDateString(undefined, {
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

function SubfeaturesGroup({ group: { events } }: { group: Group }) {
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

function NonNullGroup({ group: { events } }: { group: Group }) {
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

function Item({ event: { event, path, mdn_url } }: { event: Event }) {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale() || "en-US";
  const category = path.split(".")[0];
  const { data } = useBCD(path);
  return (
    <details
      className={`category-${category}`}
      onToggle={({ target }) =>
        target instanceof HTMLDetailsElement && setIsOpen(target.open)
      }
    >
      <summary>
        <code>{camelWrap(path.split(".").slice(1).join("."))}</code>
        <i>{CATEGORY_TO_NAME[category]}</i>
        {EVENT_TO_VERB[event]}
        <Icon name="chevron" />
      </summary>
      {isOpen && (
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
      )}
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
