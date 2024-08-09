import "./index.scss";
import { CurriculumDoc, CurriculumData } from "../../../libs/types/curriculum";
import { HydrationData } from "../../../libs/types/hydration";
import { useCurriculumDoc } from "../curriculum/utils";
import { RenderCurriculumBody } from "../curriculum/body";
import { useMemo } from "react";
import useSWRImmutable from "swr/immutable";

export function Community(appProps: HydrationData<any, CurriculumDoc>) {
  const doc = useCurriculumDoc(appProps as CurriculumData);
  return (
    <main className="community-container">
      <RenderCurriculumBody
        doc={doc}
        renderer={(section, i) => {
          if (i === 0) {
            return (
              <Header
                section={section}
                key={section.value.id}
                h1={doc?.title}
              />
            );
          } else if (section.value.id === "help_us_fix_open_issues") {
            return <Issues section={section} />;
          }
          return null;
        }}
      />
    </main>
  );
}

function Header({ section, h1 }: { section: any; h1?: string }) {
  const html = useMemo(
    () => ({ __html: section.value?.content }),
    [section.value?.content]
  );
  return (
    <header className="landing-header">
      <section>
        <h1>{h1}</h1>
        <div dangerouslySetInnerHTML={html}></div>
      </section>
    </header>
  );
}

function Issues({ section }: { section: any }) {
  const html = useMemo(
    () => ({ __html: section.value?.content }),
    [section.value?.content]
  );
  const LABELS = ["good first issue", "accepting PR"];
  const { data } = useSWRImmutable(
    `is:open is:issue repo:mdn/content repo:mdn/translated-content repo:mdn/yari label:"good first issue","accepting PR" sort:created-desc no:assignee is:public`,
    async (query) => {
      const url = new URL("https://api.github.com/search/issues");
      url.searchParams.append("per_page", "5");
      url.searchParams.append("q", query);
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    }
  );
  return (
    <section aria-labelledby={section.value.id}>
      <h2 id={section.value.id}>{section.value.title}</h2>
      <div className="section-content" dangerouslySetInnerHTML={html}></div>
      <div className="issues-table">
        <table>
          <thead>
            <th>Title</th>
            <th>Repository</th>
          </thead>
          <tbody>
            {data?.items.map(({ html_url, title, labels, repository_url }) => (
              <tr>
                <td>
                  <div>
                    <a href={html_url}>{title}</a>
                    {labels.map(({ name }) =>
                      LABELS.includes(name) ? (
                        <span className="label">{name}</span>
                      ) : null
                    )}
                  </div>
                </td>
                <td>
                  <a
                    href={repository_url.replace(
                      "https://api.github.com/repos/",
                      "https://github.com/"
                    )}
                  >
                    {repository_url.replace(
                      "https://api.github.com/repos/",
                      ""
                    )}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
