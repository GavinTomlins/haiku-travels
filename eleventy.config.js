import path from "node:path";
import Image from "@11ty/eleventy-img";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import { site } from "./src/_lib/site.js";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "src/css": "css",
    "src/js": "js",
    "src/fonts": "fonts",
    "src/favicon.svg": "favicon.svg",
    "src/img": "img",
    "src/_headers": "_headers",
    "src/robots.txt": "robots.txt",
  });
  eleventyConfig.setServerOptions({ showAllHosts: false });

  // "2026-10-19" -> "19 October 2026". Dates are calendar days, never shifted by time zone.
  eleventyConfig.addFilter("readableDate", (s) =>
    new Date(`${s}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
  );
  eleventyConfig.addFilter("year", (s) => String(s).slice(0, 4));
  eleventyConfig.addFilter("published", (list) => list.filter((h) => h.status === "published"));
  eleventyConfig.addFilter("byId", (list, id) => list.find((h) => h.id === id) ?? null);
  eleventyConfig.addFilter("absolute", (u) => new URL(u, site.url).href);
  eleventyConfig.addFilter("jsonld", (o) => JSON.stringify(o).replace(/</g, "\\u003c"));

  // Every generated image keeps the copyright stamp the content repository writes into the
  // source (EXIF and XMP), and is served under the source's name rather than a hash:
  // HaikuTravels-caravan-wave-800.webp. The content validator keeps those names unique.
  const imageOptions = (extra) => ({
    outputDir: "./_site/img/",
    urlPath: "/img/",
    filenameFormat: (id, src, width, format) => `${path.basename(src).replace(/\.[^.]+$/, "")}-${width}.${format}`,
    transform: (sharp) => sharp.keepMetadata(),
    ...extra,
  });

  // Responsive images from the content repository's media folder.
  // Pass eager=true for an image that is visible on first paint (the poem's first postcard).
  eleventyConfig.addAsyncShortcode("haikuImage", async (img, sizes = "(min-width: 44em) 40em, calc(100vw - 2rem)", eager = false, widths = [400, 800, 1600], note = "") => {
    if (!img) return "";
    const metadata = await Image(img.path, imageOptions({ widths, formats: ["webp", "jpeg"] }));
    const loading = eager ? { loading: "eager", fetchpriority: "high" } : { loading: "lazy" };
    // data-zoom names the largest WebP, which the lightbox shows when the sketch is clicked.
    const zoom = metadata.webp?.at(-1)?.url;
    const html = Image.generateHTML(metadata, { alt: img.alt, sizes, ...loading, decoding: "async", ...(zoom ? { "data-zoom": zoom } : {}) });
    const caption = img.caption ? `<figcaption>${escapeHtml(img.caption)}${img.credit ? ` (${escapeHtml(img.credit)})` : ""}</figcaption>` : "";
    const noteHtml = note ? `<figcaption class="postcard-note">${escapeHtml(note)}</figcaption>` : "";
    const marks = `<span class="stamp" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20l5-9 4 6 3-4 6 7z"/><circle cx="17" cy="6" r="2.5"/></svg></span><span class="postmark" aria-hidden="true"><span>Haiku<br>Travels</span></span>`;
    return `<figure class="postcard">${marks}${html}${caption}${noteHtml}</figure>`;
  });

  // Full-bleed background image for the illustration-first style (D). Hidden in other styles.
  eleventyConfig.addShortcode("haikuHero", (img) => {
    if (!img) return "";
    const options = imageOptions({ widths: [1600], formats: ["jpeg"] });
    Image(img.path, options);
    const metadata = Image.statsSync(img.path, options);
    const src = metadata.jpeg[0].url;
    return `<img class="hero-img" src="${src}" alt="" aria-hidden="true" loading="lazy" decoding="async">`;
  });

  // Synchronous variant for use inside loops (Nunjucks cannot await inside {% for %}).
  // Generation runs in the background; stats are available immediately.
  eleventyConfig.addShortcode("haikuThumb", (img, sizes = "12rem", widths = [400, 800]) => {
    if (!img) return "";
    const options = imageOptions({ widths, formats: ["webp", "jpeg"] });
    Image(img.path, options);
    const metadata = Image.statsSync(img.path, options);
    const html = Image.generateHTML(metadata, { alt: img.alt, sizes, loading: "lazy", decoding: "async" });
    return `<figure class="postcard">${html}</figure>`;
  });

  // A 1200px JPEG of a poem's first image, for og:image. Generated in the background like haikuThumb.
  eleventyConfig.addFilter("ogImage", (img) => {
    if (!img) return null;
    const options = imageOptions({ widths: [1200], formats: ["jpeg"] });
    Image(img.path, options);
    return Image.statsSync(img.path, options).jpeg[0];
  });

  // Group a sorted list of poems into [{ year, haikus }] for the index pages.
  eleventyConfig.addFilter("byYear", (list) => {
    const groups = [];
    for (const h of list) {
      const year = String(h.date).slice(0, 4);
      const last = groups[groups.length - 1];
      if (last && last.year === year) last.haikus.push(h);
      else groups.push({ year, haikus: [h] });
    }
    return groups;
  });

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "poems", limit: 30 },
    metadata: {
      language: "en",
      title: site.title,
      subtitle: site.description,
      base: site.url,
      author: { name: site.author },
    },
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
