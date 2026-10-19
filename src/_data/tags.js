import { loadPublic } from "../_lib/content.js";
export default function () {
  const byTag = new Map();
  for (const h of loadPublic()) {
    for (const tag of h.tags) {
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag).push(h);
    }
  }
  return [...byTag.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([slug, haikus]) => ({ slug, label: slug.replace(/-/g, " "), haikus }));
}
