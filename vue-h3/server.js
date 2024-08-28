import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToString } from "vue/server-renderer";
import { createApp as createH3App } from "h3";
import {
  createRouter,
  defineEventHandler,
  toNodeListener,
  setHeader,
  createError,
} from "h3";

import vueSSR from "./client/dist/server/index.js";

const h3App = createH3App();
const router = createRouter();

const rootPath = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(rootPath, "client/dist/");

const template = fs.readFileSync(`${distPath}/client/index.html`, "utf-8");

router.get(
  "/",
  defineEventHandler(async (event) => {
    const appContent = await renderToString(vueSSR.createApp());

    setHeader(event, "Content-Type", "text/html");

    return template.replace(`<!-- element -->`, appContent);
  })
);

router.get(
  "/assets/*",
  defineEventHandler((event) => {
    if (event.path.match(/css$/)) {
      setHeader(event, "Content-Type", "text/css");
    } else if (event.path.match(/js$/)) {
      setHeader(event, "Content-Type", "application/javascript");
    } else {
      throw new createError({
        statusMessage: "Asset not found",
        statusCode: 404,
      });
    }

    return fs.readFileSync(`${distPath}/client/${event.path}`, "utf-8");
  })
);

h3App.use(router);

createServer(toNodeListener(h3App)).listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});
