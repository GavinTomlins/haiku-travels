#!/usr/bin/env node
// Fails if any draft poem, private note or coordinate from the content
// repository appears anywhere in the built site. Run after `eleventy`.
import fs from "node:fs";
import path from "node:path";
import { loadAll } from "../src/_lib/content.js";

const outDir = path.resolve(process.env.OUTPUT_DIR || "_site");
if (!fs.existsSync(outDir)) {
  console.error(`error: ${outDir} does not exist; run the build first.`);
  process.exit(1);
}

const entries = loadAll();
const sentinels = []; // { label, needle }
for (const { fm, lines } of entries) {
  if (fm.status === "draft") {
    sentinels.push({ label: `draft ${fm.id}: id`, needle: fm.id });
    sentinels.push({ label: `draft ${fm.id}: title`, needle: fm.title });
    for (const l of lines) sentinels.push({ label: `draft ${fm.id}: poem line`, needle: l });
  }
  if (typeof fm.notes === "string" && fm.notes.trim()) {
    sentinels.push({ label: `${fm.id}: private notes`, needle: fm.notes.trim() });
  }
  const c = fm.location?.coordinates;
  if (c && typeof c.lat === "number" && typeof c.lng === "number") {
    sentinels.push({ label: `${fm.id}: latitude`, needle: String(c.lat) });
    sentinels.push({ label: `${fm.id}: longitude`, needle: String(c.lng) });
  }
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}
const textExt = new Set([".html", ".xml", ".json", ".txt", ".js", ".css", ".webmanifest", ""]);
const files = walk(outDir).filter((f) => textExt.has(path.extname(f)));

const problems = [];
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  for (const s of sentinels) {
    if (s.needle && text.includes(s.needle)) problems.push(`${path.relative(outDir, f)} contains ${s.label}`);
  }
}

// Sanity: every published poem has a page; no draft has one.
for (const { fm } of entries) {
  const page = path.join(outDir, "haiku", fm.id, "index.html");
  if (fm.status === "published" && !fs.existsSync(page)) problems.push(`published ${fm.id} has no page at haiku/${fm.id}/`);
  if (fm.status === "draft" && fs.existsSync(page)) problems.push(`draft ${fm.id} has a page at haiku/${fm.id}/`);
}

if (problems.length) {
  for (const p of problems) console.error(`error: ${p}`);
  console.error(`\n${problems.length} leak(s) found in ${files.length} file(s).`);
  process.exit(1);
}
const drafts = entries.filter((e) => e.fm.status === "draft").length;
console.log(`OK: ${files.length} output file(s) checked against ${sentinels.length} sentinel(s) from ${drafts} draft(s); no leaks.`);
