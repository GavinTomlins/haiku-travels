#!/usr/bin/env node
// Draws the monogram that sits inside the ensō (src/_includes/emblem.svg.njk)
// for each author mark, as SVG path data in the emblem's 48x48 viewBox.
//
// The GT mark was delivered as artwork: EB Garamond at weight 800, cap height
// 10.2 units, baseline at y 29.4, centred on x 24.55. NT is set the same way.
// GNT is three letters and would overflow the ring at that size, so it is
// scaled down to fit a 22-unit inner width and kept vertically centred on the
// GT mark. Letters are kerned and converted to paths with fontkit so the page
// never needs the bold face.
//
// Needs the variable font once, which is not committed:
//   mkdir -p scripts/fonts && curl -sL -o scripts/fonts/EBGaramond-wght.ttf \
//     'https://github.com/google/fonts/raw/main/ofl/ebgaramond/EBGaramond%5Bwght%5D.ttf'
//   node scripts/make-monogram.mjs            # prints the paths
//   node scripts/make-monogram.mjs --preview  # also writes scripts/monogram-preview.svg
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as fontkit from "fontkit";

const here = path.dirname(fileURLToPath(import.meta.url));
const fontFile = path.join(here, "fonts/EBGaramond-wght.ttf");
if (!fs.existsSync(fontFile)) {
  console.error(`missing ${path.relative(process.cwd(), fontFile)}; see the comment at the top of this script`);
  process.exit(2);
}
const font = fontkit.openSync(fontFile).getVariation({ wght: 800 });

const CAP = 10.2; // cap height of the delivered GT mark, in viewBox units
const BASELINE = 29.4;
const CENTRE_X = 24.55;
const CENTRE_Y = BASELINE - CAP / 2;
const MAX_WIDTH = 24.5; // the ring is 28 units across inside; GT itself is 21.3 wide
const TRACKING = { GNT: -45 }; // font units taken out of each gap so three letters keep some height

const r1 = (n) => Math.round(n * 10) / 10;

export function monogram(text) {
  const run = font.layout(text, ["kern"]);
  const track = TRACKING[text] ?? 0;
  run.positions.forEach((p, i) => { if (i < run.positions.length - 1) p.xAdvance += track; });
  const advance = run.positions.reduce((w, p) => w + p.xAdvance, 0);
  const capScale = CAP / font.capHeight;
  const scale = Math.min(capScale, MAX_WIDTH / advance);
  const width = advance * scale;
  const cap = font.capHeight * scale;
  const baseline = CENTRE_Y + cap / 2;
  const x0 = CENTRE_X - width / 2;
  let pen = 0;
  const parts = [];
  run.glyphs.forEach((g, i) => {
    const pos = run.positions[i];
    const p = g.path.transform(scale, 0, 0, -scale, x0 + (pen + pos.xOffset) * scale, baseline - pos.yOffset * scale);
    parts.push(p.toSVG());
    pen += pos.xAdvance;
  });
  const d = parts.join("").replace(/-?\d+\.\d+/g, (n) => String(r1(+n)));
  return { text, d, width: r1(width), cap: r1(cap), baseline: r1(baseline) };
}

const RING = fs.readFileSync(path.join(here, "../src/_includes/emblem.svg.njk"), "utf8").match(/ d="([^"]+)"/)[1];

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const marks = ["GT", "NT", "GNT"].map(monogram);
  for (const m of marks) console.log(`${m.text}: width ${m.width} cap ${m.cap} baseline ${m.baseline}\n${m.d}\n`);
  if (process.argv.includes("--preview")) {
    const cells = marks.map((m, i) => `<g transform="translate(${i * 56} 0)"><path fill="#7d2e1e" d="${RING}"/><path fill="#7d2e1e" d="${m.d}"/></g>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 48" width="840" height="240"><rect width="168" height="48" fill="#f4ecd8"/>${cells}</svg>`;
    const out = path.join(here, "monogram-preview.svg");
    fs.writeFileSync(out, svg);
    console.log(`wrote ${path.relative(process.cwd(), out)}`);
  }
}
