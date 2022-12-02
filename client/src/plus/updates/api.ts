import bcd from "@mdn/browser-compat-data";
import type BCD from "@mdn/browser-compat-data/types";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import data from "./dummy-changes.json";

export enum GroupType {
  Browser,
  Subfeatures,
  NonNull,
}

interface GenericGroup {
  id: string;
  type: GroupType;
  events: Event[];
  date: string;
}

interface BrowserGroup extends GenericGroup {
  browser: Browser;
}

export type Group = GenericGroup | BrowserGroup;

export interface Browser {
  browser: string;
  name: string;
  version: string;
}

export interface Event {
  id: string;
  event: string;
  path: string;
  mdn_url?: string;
}

export function useUpdates() {
  const res = useSWRInfinite<Group[]>(
    (page: number, previousPage: Group[]) => {
      if (previousPage && !previousPage.length) return null;
      return "dummy_updates" + page;
    },
    async (key) => {
      await new Promise<void>((r) => setTimeout(() => r(), 1000));
      const page = parseInt(key.replace("dummy_updates", ""), 10);
      return data
        .slice(page * 10, (page + 1) * 10)
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
            return events
              .reduce<typeof events[]>((acc, curr) => {
                const exploded = curr?.browsers?.map((x) => ({
                  ...curr,
                  browsers: [x],
                }));
                exploded?.forEach((event) => {
                  const browser = event.browsers[0].browser;
                  const existing = acc.find(
                    (x) => x?.[0]?.browsers?.[0].browser === browser
                  );
                  if (existing) {
                    existing.push(event);
                  } else {
                    acc.push([event]);
                  }
                });
                return acc;
              }, [])
              .map((events) => {
                const browser = events[0].browsers?.[0];
                return {
                  id: `${browser?.browser}-${browser?.version}` + page,
                  type: GroupType.Browser,
                  events: events.map((e) => ({ id: e.event + e.path, ...e })),
                  date:
                    (browser
                      ? bcd.browsers[browser.browser].releases[browser.version]
                          .release_date
                      : null) || new Date().toISOString(),
                  browser: browser
                    ? {
                        browser: browser.browser,
                        name: bcd.browsers[browser.browser].name,
                        version: browser.version,
                      }
                    : undefined,
                };
              });
          }
          return {
            id: events.reduce((acc, curr) => acc + curr.path, "") + page,
            type:
              type === "added_subfeatures"
                ? GroupType.Subfeatures
                : GroupType.NonNull,
            events: events.map((e) => ({ id: e.path, ...e })),
            date: new Date().toISOString(),
          };
        })
        .flat(1) as Group[];
    }
  );
  return {
    ...res,
    isLoading:
      res.isValidating &&
      !res.error &&
      (!res.data || res.data.length !== res.size),
    atEnd: (res.data && res.data[res.data.length - 1].length === 0) || false,
  };
}

export function useBCD(path: string) {
  return useSWR(path, (key) => {
    return {
      data: key
        .split(".")
        .reduce((prev, curr) => prev[curr], bcd) as unknown as BCD.Identifier,
      browsers: bcd.browsers,
    };
  });
}
