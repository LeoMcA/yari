import useSWRInfinite from "swr/infinite";
import { Button } from "../../ui/atoms/button";
import Container from "../../ui/atoms/container";
import "./index.scss";
import { LazyBrowserCompatibilityTableInner } from "../../document/lazy-bcd-table";

interface Data {
  path: string;
  browsers: Browser[];
  spec_url?: string[];
  description?: string;
}

interface Browser {
  browser: string;
}

interface Notification {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  text: string;
  data?: Data;
  url: string;
}

export default function Stream() {
  const {
    data: notifications = [],
    size,
    setSize,
  } = useSWRInfinite<Notification[]>(
    (page: number, previousPage: Notification[]) => {
      if (previousPage && !previousPage.length) return null;
      return `/api/v2/notifications/?limit=10&offset=${
        page * 10
      }&q=firefox,firefox_android,chrome,chrome_android,safari,safari_ios`;
    },
    async (key) => {
      const res = await fetch(key);
      return res.json();
    }
  );
  const atEnd = notifications?.[notifications?.length - 1]?.length < 10;
  console.log(notifications);
  return (
    <Container>
      {notifications
        .flat(1)
        .filter(
          ({ title, data: { path = "" } = {} }) =>
            path.split(".").slice(1).join(".") !== title
        )
        .map(
          ({
            id,
            title,
            data: { browsers = [], path, spec_url = [], description } = {},
            url,
          }) => {
            return (
              <article
                key={id}
                className={
                  browsers.map((x) => x.browser + "-highlight").join(" ") +
                  " section-" +
                  path?.split(".")[0]
                }
              >
                <h2></h2>
                <h3>
                  {description?.replace("<code>", "").replace("</code>", "") ||
                    title}
                </h3>
                <p>
                  <a href={url}>{url}</a>
                </p>
                {spec_url?.map((x) => (
                  <p>
                    <a href={x}>{x}</a>
                  </p>
                ))}
                <LazyBrowserCompatibilityTableInner
                  dataURL={
                    url.replace("https://developer.mozilla.org", "") +
                    "/bcd.json"
                  }
                />
              </article>
            );
          }
        )}
      <div className="pagination">
        {!atEnd && (
          <Button onClickHandler={() => setSize(size + 1)}>Load more</Button>
        )}
      </div>
    </Container>
  );
}
