# haiku-travels

The website for [haikutravels.xyz](https://haikutravels.xyz): personal
experiences, observations and reflections, expressed through haiku.

This repository holds the site code only. The poems, their metadata and
photographs live in
[haiku-travels-content](https://github.com/GavinTomlins/haiku-travels-content)
and are licensed separately (CC BY-NC-ND 4.0). The code here is MIT
licensed; see [LICENSE](LICENSE).

## How it works

- [Eleventy](https://www.11ty.dev/) reads Markdown poems from `content/`
  and generates a static site into `_site/`: a chronological index, one
  canonical page per poem, pages per type and per tag, a search page
  backed by a build-time JSON index, an Atom feed and a sitemap.
- Drafts (`status: draft`) are excluded at load time. `npm run
  check:leaks` scans the built output for every draft's id, title and
  lines, every private note and every coordinate, and fails if any
  appear. CI runs it before every deploy.
- Private fields (`notes`, `location.coordinates`) are stripped before
  templates ever see them.
- The site is deployed to Cloudflare Pages by GitHub Actions with
  wrangler. A push to this repository's `main` deploys. A push to the
  content repository's `main` sends a `content-updated` dispatch carrying
  the content commit SHA, and the same workflow builds from exactly that
  commit. Every deployment is labelled with both SHAs.

## Local development

```
git clone git@github.com:GavinTomlins/haiku-travels.git
git clone git@github.com:GavinTomlins/haiku-travels-content.git
cd haiku-travels
ln -s ../haiku-travels-content content     # or set CONTENT_DIR
npm install
npm run dev                                # http://localhost:8080, drafts included
```

`npm run dev` sets `HAIKU_INCLUDE_DRAFTS=1` so you can preview drafts.
That flag is ignored when `CI` is set, so a draft can never reach a
deployment. Drafts are marked with a badge when shown locally.

```
npm run build          # production build into _site/
npm run check:leaks    # verify no draft or private field is in _site/
npm run verify         # both
```

## Deployment

Secrets on this repository (Settings, Secrets and variables, Actions):

| Secret | Purpose |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account that owns the Pages project |
| `CLOUDFLARE_API_TOKEN` | Token with the Cloudflare Pages: Edit permission |

Secret on the content repository:

| Secret | Purpose |
|---|---|
| `SITE_DISPATCH_TOKEN` | Fine-grained GitHub token, this repository only, Contents: read and write, used to send the dispatch |

The workflow creates the Pages project `haikutravels` on first run if it
does not exist. Pull requests deploy to a preview URL on `pages.dev`.
