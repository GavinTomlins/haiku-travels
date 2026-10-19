import Image from "@11ty/eleventy-img";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import { site } from "./src/_lib/site.js";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "src/css": "css",
    "src/js": "js",
    "src/_headers": "_headers",
    "src/robots.txt": "robots.txt",
  });
  eleventyConfig.setServerOptions({ showAllHosts: false });

  // "2026-10-19" -> "19 October 2026". Dates are calendar days, never shifted by time zone.
  eleventyConfig.addFilter("readableDate", (s) =>
    new Date(`${s}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
  );
  eleventyConfig.addFilter("year", (s) => String(s).slice(0, 4));
  eleventyConfig.addFilter("absolute", (u) => new URL(u, site.url).href);
  eleventyConfig.addFilter("jsonld", (o) => JSON.stringify(o).replace(/</g, "\\u003c"));

  // Responsive images from the content repository's media folder.
  eleventyConfig.addAsyncShortcode("haikuImage", async (img, sizes = "(min-width: 44em) 40em, calc(100vw - 2rem)", widths = [400, 800, 1600]) => {
    if (!img) return "";
    const metadata = await Image(img.path, {
      widths,
      formats: ["webp", "jpeg"],
      outputDir: "./_site/img/",
      urlPath: "/img/",
    });
    const html = Image.generateHTML(metadata, { alt: img.alt, sizes, loading: "lazy", decoding: "async" });
    const caption = img.caption ? `<figcaption>${escapeHtml(img.caption)}${img.credit ? ` (${escapeHtml(img.credit)})` : ""}</figcaption>` : "";
    return `<figure class="postcard">${html}${caption}</figure>`;
  });

  // Synchronous variant for use inside loops (Nunjucks cannot await inside {% for %}).
  // Generation runs in the background; stats are available immediately.
  eleventyConfig.addShortcode("haikuThumb", (img, sizes = "12rem", widths = [400, 800]) => {
    if (!img) return "";
    const options = { widths, formats: ["webp", "jpeg"], outputDir: "./_site/img/", urlPath: "/img/" };
    Image(img.path, options);
    const metadata = Image.statsSync(img.path, options);
    const html = Image.generateHTML(metadata, { alt: img.alt, sizes, loading: "lazy", decoding: "async" });
    return `<figure class="postcard">${html}</figure>`;
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
