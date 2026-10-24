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
    title: fm.title,
    date: fm.date,
    created: fm.created ?? null,
    updated: fm.updated ?? null,
    type: fm.type,
    tags: [...(fm.tags ?? [])].sort(),
    status: fm.status,
    author: fm.author,
    order: Number.isInteger(fm.order) ? fm.order : null,
    language: fm.language ?? "en",
    collections: fm.collections ?? [],
    location,
    images,
    lines,
    url: `/haiku/${fm.id}/`,
  };
}

export function loadPublic() {
  return loadAll()
    .filter((e) => e.fm.status === "published" || (includeDrafts && e.fm.status === "draft"))
    .map(toPublic)
    .sort(compare);
}

// Newest date first. Within a day, an explicit `order` wins (lower first,
// unordered poems last), then the id keeps the result stable.
function compare(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  const ao = a.order ?? Infinity;
  const bo = b.order ?? Infinity;
  if (ao !== bo) return ao - bo;
  return a.id.localeCompare(b.id);
}
