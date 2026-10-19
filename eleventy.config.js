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
  eleventyConfig.addFilter("absoluteUrl", (u) => new URL(u, site.url).href);
  eleventyConfig.addFilter("jsonld", (o) => JSON.stringify(o).replace(/</g, "\\u003c"));

  // Responsive images from the content repository's media folder.
  eleventyConfig.addAsyncShortcode("haikuImage", async (img, sizes = "(min-width: 44em) 40em, calc(100vw - 2rem)") => {
    if (!img) return "";
    const metadata = await Image(img.path, {
      widths: [400, 800, 1600],
      formats: ["webp", "jpeg"],
      outputDir: "./_site/img/",
      urlPath: "/img/",
    });
    const html = Image.generateHTML(metadata, { alt: img.alt, sizes, loading: "lazy", decoding: "async" });
    const caption = img.caption ? `<figcaption>${escapeHtml(img.caption)}${img.credit ? ` (${escapeHtml(img.credit)})` : ""}</figcaption>` : "";
    return `<figure class="haiku-figure">${html}${caption}</figure>`;
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
