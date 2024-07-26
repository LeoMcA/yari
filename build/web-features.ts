import { features } from "web-features";
import { computeBaseline } from "compute-baseline";
import { writeFileSync } from "node:fs";

import type { Doc } from "../libs/types/document.js";

const metadata = {
  multiple_keys: {},
  previously_filtered: {
    high: {},
    low: {},
    not: {},
  },
  feature_high: {
    high: {},
    low: {},
    not: {},
  },
  feature_low: {
    high: {},
    low: {},
    not: {},
  },
  feature_not: {
    high: {},
    low: {},
    not: {},
  },
};

export function addBaseline(doc: Partial<Doc>) {
  if (doc.browserCompat && !doc.mdn_url?.includes("/docs/MDN/")) {
    if (doc.browserCompat.length !== 1) {
      if (doc.browserCompat.length > 1) {
        createOrPush(metadata.multiple_keys, doc);
      }
      write();
      return;
    }

    const key = doc.browserCompat[0];

    const previouslyFilteredKey =
      // temporary blocklist while we wait for per-key baseline statuses
      // or another solution to the baseline/bcd table discrepancy problem
      [
        // https://github.com/web-platform-dx/web-features/blob/cf718ad/feature-group-definitions/async-clipboard.yml
        "api.Clipboard.read",
        "api.Clipboard.readText",
        "api.Clipboard.write",
        "api.Clipboard.writeText",
        "api.ClipboardEvent",
        "api.ClipboardEvent.ClipboardEvent",
        "api.ClipboardEvent.clipboardData",
        "api.ClipboardItem",
        "api.ClipboardItem.ClipboardItem",
        "api.ClipboardItem.getType",
        "api.ClipboardItem.presentationStyle",
        "api.ClipboardItem.types",
        "api.Navigator.clipboard",
        "api.Permissions.permission_clipboard-read",
        // https://github.com/web-platform-dx/web-features/blob/cf718ad/feature-group-definitions/custom-elements.yml
        "api.CustomElementRegistry",
        "api.CustomElementRegistry.builtin_element_support",
        "api.CustomElementRegistry.define",
        "api.Window.customElements",
        "css.selectors.defined",
        "css.selectors.host",
        "css.selectors.host-context",
        "css.selectors.part",
        // https://github.com/web-platform-dx/web-features/blob/cf718ad/feature-group-definitions/input-event.yml
        "api.Element.input_event",
        "api.InputEvent.InputEvent",
        "api.InputEvent.data",
        "api.InputEvent.dataTransfer",
        "api.InputEvent.getTargetRanges",
        "api.InputEvent.inputType",
        // https://github.com/web-platform-dx/web-features/issues/1038
        // https://github.com/web-platform-dx/web-features/blob/64d2cfd/features/screen-orientation-lock.dist.yml
        "api.ScreenOrientation.lock",
        "api.ScreenOrientation.unlock",
      ].includes(key);

    const [featureStatus, keyStatus] = getStatus(key);

    if (!featureStatus) {
      return;
    }

    if (previouslyFilteredKey) {
      createOrPush(
        metadata.previously_filtered[keyStatus.baseline || "not"],
        doc
      );
    }

    if (featureStatus.baseline === "high") {
      createOrPush(metadata.feature_high[keyStatus.baseline || "not"], doc);
    } else if (featureStatus.baseline === "low") {
      createOrPush(metadata.feature_low[keyStatus.baseline || "not"], doc);
    } else if (featureStatus.baseline === false) {
      createOrPush(metadata.feature_not[keyStatus.baseline || "not"], doc);
    }

    write();

    return keyStatus;
  }
}

function getStatus(key: string) {
  for (const feature of Object.values(features)) {
    if (feature.status && feature.compat_features?.includes(key)) {
      return [feature.status, computeBaseline({ compatKeys: [key] })];
    }
  }
  return [undefined, undefined];
}

function write() {
  writeFileSync(
    "baseline.count.json",
    JSON.stringify(
      metadata,
      (key, value) => (Array.isArray(value) ? value.length : value),
      2
    ),
    "utf-8"
  );
  writeFileSync(
    "baseline.list.json",
    JSON.stringify(
      metadata,
      (key, value) => (Array.isArray(value) ? value.sort() : value),
      2
    ),
    "utf-8"
  );
}

function createOrPush(obj: object, doc: Partial<Doc>) {
  const pageType = doc.pageType || "no-type";
  const url = doc.mdn_url;
  (obj["all"] = obj["all"] || []).push(url);
  (obj[pageType] = obj[pageType] || []).push(url);
}
