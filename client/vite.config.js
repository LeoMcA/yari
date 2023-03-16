import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

const config = {
  plugins: [react(), svgr()],
  resolve: {
    alias: [
      {
        // this is required for the SCSS modules
        find: /^~(.*)$/,
        replacement: "$1",
      },
    ],
  },
  envPrefix: "REACT_APP_",
};

export default config;
