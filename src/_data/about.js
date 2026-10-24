import path from "node:path";
import { CONTENT_DIR } from "../_lib/content.js";

const media = (src, alt) => ({ path: path.join(CONTENT_DIR, src), src, alt, caption: null, credit: null });

export default {
  hero: media(
    "media/about/caravan-sunset.jpg",
    "Pencil sketch of a four-wheel drive towing a caravan along a winding coastal road at sunset, a gum tree leaning over the road and islands on the water beyond",
  ),
  portrait: media("media/about/portrait.jpg", "Pencil portrait of Gavin Tomlins"),
  tagline: "Some journeys begin without a destination.",
  intro: "A technologist, social enterprise advocate and curious traveller.",
  epigraph: "ht-20261020-a-quiet-hello",
};
