import { renderToString } from "react-dom/server";
import React from "react";
import { StaticRouter } from "react-router-dom/server";

import { App } from "./app";

export function render(url, context) {
  return renderToString(
    React.createElement(
      StaticRouter,
      { location: url },
      React.createElement(App, context)
    )
  );
}
