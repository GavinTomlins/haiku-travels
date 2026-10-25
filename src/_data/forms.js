import { loadPublic } from "../_lib/content.js";
import { site } from "../_lib/site.js";

/** The forms that have published poems, each with its poems, for the /form/ pages. */
export default function () {
  const all = loadPublic();
  return site.formList.map((f) => ({ ...f, haikus: all.filter((h) => h.form === f.slug) })).filter((f) => f.haikus.length > 0);
}
