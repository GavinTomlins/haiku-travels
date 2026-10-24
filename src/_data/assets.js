// Short content hashes so stylesheet and script URLs change whenever the files do.
import fs from "node:fs";
import crypto from "node:crypto";
const hash = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 10);
export default {
  css: hash("src/css/site.css"),
  search: hash("src/js/search.js"),
  pageTurn: hash("src/js/page-turn.js"),
  poemActions: hash("src/js/poem-actions.js"),
  styleSwitch: hash("src/js/style-switch.js"),
  lightbox: hash("src/js/lightbox.js"),
};
