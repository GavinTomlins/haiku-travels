import { loadPublic } from "../_lib/content.js";
import { site } from "../_lib/site.js";
export default function () {
  const all = loadPublic();
  return site.types
    .map((t) => ({ ...t, haikus: all.filter((h) => h.type === t.slug) }))
    .filter((t) => t.haikus.length > 0);
}
