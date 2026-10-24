// Loads poems from the content repository checkout. Everything the templates
// see passes through toPublic(), which drops private fields. Drafts are
// excluded unless HAIKU_INCLUDE_DRAFTS=1 and the build is not running in CI.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";

export const CONTENT_DIR = path.resolve(process.env.CONTENT_DIR || "content");
export const includeDrafts = process.env.HAIKU_INCLUDE_DRAFTS === "1" && !process.env.CI;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return d.isFile() && p.endsWith(".md") ? [p] : [];
  });
}

let cache;

/** Raw entries, including drafts and private fields. For the loader and the leak check only. */
export function loadAll() {
  if (cache) return cache;
  const haikusDir = path.join(CONTENT_DIR, "haikus");
  if (!fs.existsSync(haikusDir)) {
    throw new Error(
      `Content not found at ${haikusDir}. Clone GavinTomlins/haiku-travels-content to ./content (or symlink it), or set CONTENT_DIR.`,
    );
  }
  cache = walk(haikusDir).map((file) => {
    const parsed = matter(fs.readFileSync(file, "utf8"), {
      engines: { yaml: (src) => yaml.load(src, { schema: yaml.JSON_SCHEMA }) },
    });
    const lines = parsed.content
      .split(/\r?\n/)
      .map((l) => l.trimEnd())
      .filter((l) => l.trim() !== "");
    return { file: path.relative(CONTENT_DIR, file), fm: parsed.data, lines };
  });
  return cache;
}

// Characters in the poem's longest line, clamped to the .chars-N classes the stylesheet
// defines (12–48). The poem page uses it to size the type so that line fits unbroken.
export function longestLine(lines) {
  const n = Math.max(0, ...lines.map((l) => [...l].length));
  return Math.min(48, Math.max(12, n));
}

/** The public shape. No notes, no coordinates, no file paths beyond image sources. */
export function toPublic({ fm, lines }) {
  const location = fm.location && fm.location.name ? { name: fm.location.name, country: fm.location.country ?? null } : null;
  const images = (fm.media?.images ?? []).map((img) => ({
    path: path.join(CONTENT_DIR, img.src),
    src: img.src,
    alt: img.alt,
    caption: img.caption ?? null,
    credit: img.credit ?? null,
  }));
  return {
    id: fm.id,
    number: null,
    title: fm.title,
    date: fm.date,
    created: fm.created ?? null,
    updated: fm.updated ?? null,
    type: fm.type,
    tags: [...(fm.tags ?? [])].sort(),
    status: fm.status,
    author: fm.author,
    initials: initialsOf(fm.author),
    order: Number.isInteger(fm.order) ? fm.order : null,
    language: fm.language ?? "en",
    collections: fm.collections ?? [],
    location,
    images,
    lines,
    longest: longestLine(lines),
    url: `/haiku/${fm.id}/`,
  };
}

/**
 * Published poems newest first, each carrying its journal number: the first
 * poem ever published is No. 1 and the number never changes as poems are added.
 * Drafts (dev builds only) are merged in without a number so they never shift it.
 */
// "Gavin Tomlins" -> "GT"; "Gavin N. Tomlins" -> "GNT".
export function initialsOf(name) {
  return String(name ?? "").split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).join("");
}

export function loadPublic() {
  const all = loadAll().map(toPublic);
  const published = all.filter((h) => h.status === "published").sort(compare);
  published.forEach((h, i) => { h.number = published.length - i; });
  if (!includeDrafts) return published;
  const drafts = all.filter((h) => h.status === "draft");
  for (const d of drafts) d.number = null;
  return [...published, ...drafts].sort(compare);
}

// Newest date first. Within a day, an explicit `order` wins (lower first,
// unordered poems last), then the id keeps the result stable.
// Newest first. Poems that share a date follow their order field, which is the
// sequence they were written in (order 1 is the earliest), so a higher order is newer.
function compare(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  const ao = a.order ?? -Infinity;
  const bo = b.order ?? -Infinity;
  if (ao !== bo) return bo - ao;
  return b.id.localeCompare(a.id);
}
