# Personal portfolio — Ayoola Olaoye

Static site for a dual-track (law / engineering) portfolio. Content is written
as markdown files; a small Node script (`build.js`, zero dependencies)
generates the HTML.

---

## Quick start

```bash
node build.js
```

That regenerates `index.html`, `law.html`, `engineering.html`, every
`articles/<slug>.html`, plus `sitemap.xml` and `robots.txt`. The site is
plain static files — drop the repo onto Netlify, Vercel, GitHub Pages, S3,
or any other static host.

For zero-touch publishing on Netlify/Vercel, set the build command to
`node build.js` and the publish directory to the repo root. Push to git, the
site rebuilds automatically.

---

## Before you deploy — required

Open **`site.config.json`** and set `"url"` to your real domain:

```json
{
  "url": "https://your-real-domain.com",
  ...
}
```

Every canonical URL, Open Graph tag, sitemap entry, and JSON-LD record is
derived from this. `build.js` prints a warning until you change it from the
placeholder.

While you're there, also review:

- `name`, `title`, `tagline`, `description` — used in `<title>`, social
  previews, and the homepage `Person` schema
- `jobTitle`, `knowsAbout` — surface in JSON-LD; help Google understand
  what you do
- `sameAs` — list of profile URLs (LinkedIn, GitHub, Twitter, etc.)
- `image` — optional path to an Open Graph image (e.g. `/og.jpg`); when
  set, Twitter cards switch to `summary_large_image`

---

## Adding content

Drop a markdown file in the right folder, then run `node build.js`.

```
content/
  law/
    _intro.md                          ← position statement (body only)
    work/2025-04-new-matter.md
    writing/2025-05-new-essay.md
  engineering/
    _intro.md
    work/2025-04-new-project.md
    writing/2025-05-new-post.md
```

**Filenames matter.** Use a date prefix like `YYYY-MM-slug.md`. Entries
sort by filename descending, so newer dates appear first naturally.

### Work entries

```markdown
---
year: 2025
title: My Project
desc: One-line description.
italic: false
href: https://github.com/you/my-project   # optional
---
```

| Field | Required | Notes |
|---|---|---|
| `year` | yes | Display string. `2025` or `Apr 2025`. |
| `title` | yes | Entry title. |
| `desc` | yes | One-line description shown under the title. |
| `italic` | no | `true` wraps the title in `<em>` (case names, paper titles). |
| `href` | no | If an `http(s)` URL, the link opens in a new tab. Without it, the title is a bare anchor. |

The body of work files is currently unused — feel free to leave it empty or
keep notes there.

### Writing entries

```markdown
---
year: May 2025
title: My Essay
desc: One-line description.
italic: false
also_in: engineering   # optional — see below
---

Full article body in **markdown** goes here. The build emits a dedicated
page at `articles/<slug>.html`.

## Headings, lists, blockquotes, code blocks all supported

> Blockquotes work too.
```

Same fields as work, plus:

| Field | Required | Notes |
|---|---|---|
| `also_in` | no | `law` or `engineering`. Mirrors the entry onto the other track's page with an "Also in …" annotation. The article is generated once and linked from both pages. |
| `href` | no | If set, the build skips the article page and links externally instead — useful for pieces published elsewhere. |

### Cross-track writing

If a piece belongs in both Law and Engineering, file it in one folder and
add `also_in:` pointing to the other track:

```markdown
---
year: Aug 2024
title: State Machines as Contracts
desc: Why deterministic state management and legal drafting are the same intellectual problem.
also_in: engineering
---

Article body here…
```

It will appear on both `law.html` and `engineering.html` with the right
"Also in …" annotation, and show up once in the search index labelled
`Law + Engineering`.

### Position statements

Edit `content/<track>/_intro.md` to change the prose under the track
heading. The first paragraph is also used as the track page's
`<meta description>`, so make it count.

---

## Markdown features supported

The inline renderer in `build.js` handles:

- Paragraphs (blank-line separated)
- Headings: `#` through `######`
- **Bold** (`**text**` / `__text__`) and *italic* (`*text*` / `_text_`)
- Inline `` `code` `` and fenced code blocks
- Unordered (`-`, `*`) and ordered (`1.`) lists — single level
- Blockquotes (`>`)
- Links (`[label](url)`) — external `http(s)` links open in a new tab
- Horizontal rules (`---`)
- Soft line breaks (two trailing spaces)

Tables, images, footnotes, and nested lists are not supported. If you need
them, swap the inline renderer for `marked` (one npm dep) — see
`renderMarkdown` / `inlineMd` in `build.js`.

---

## SEO — what the build emits

Each page automatically gets:

- `<title>`, `<meta name="description">`, `<link rel="canonical">`
- Open Graph: `og:title`, `og:description`, `og:type`, `og:url`,
  `og:site_name`, `og:locale`, `og:image` (if configured)
- Twitter card: `summary` (or `summary_large_image` when `image` is set)
- JSON-LD structured data:
  - **Homepage**: `Person` (with `jobTitle`, `knowsAbout`, `sameAs`)
  - **Track pages**: `WebPage` with `about: Law` / `about: Engineering`
  - **Article pages**: `Article` with `datePublished` (parsed from the
    filename's date prefix), `author`, `mainEntityOfPage`, and `about`
    listing the relevant track(s)

The build also emits:

- `sitemap.xml` — homepage, both track pages, and every public article
  with `<lastmod>` parsed from the filename
- `robots.txt` — allows all crawlers, points to the sitemap

`<title>` formats:

- Homepage → `site.config.json#title` (defaults to "Ayoola Olaoye —
  Corporate Lawyer & Software Engineer")
- Track → `Ayoola Olaoye — Law` / `Ayoola Olaoye — Engineering`
- Article → `<entry title> — Ayoola Olaoye`

---

## Going live — checklist

1. Set `url` in `site.config.json` to your real domain.
2. (Optional) Add an Open Graph image at e.g. `/og.jpg` and set
   `"image": "/og.jpg"` in the config.
3. Run `node build.js` and verify `sitemap.xml` lists every URL with the
   right domain.
4. Deploy.
5. Submit `https://yourdomain/sitemap.xml` to **Google Search Console**
   and **Bing Webmaster Tools**.
6. Verify a sample page in:
   - [Google Rich Results Test](https://search.google.com/test/rich-results)
     — confirms the JSON-LD parses
   - [Open Graph debugger](https://developers.facebook.com/tools/debug/) /
     [Twitter card validator](https://cards-dev.twitter.com/validator)
     — confirms social previews

---

## Project structure

```
.
├── build.js                  # static site generator (zero deps)
├── site.config.json          # site URL, name, description, social links
├── style.css                 # shared stylesheet
├── content/
│   ├── law/
│   │   ├── _intro.md
│   │   ├── work/*.md
│   │   └── writing/*.md
│   └── engineering/
│       ├── _intro.md
│       ├── work/*.md
│       └── writing/*.md
├── index.html                # generated
├── law.html                  # generated
├── engineering.html          # generated
├── articles/*.html           # generated, one per writing entry
├── sitemap.xml               # generated
└── robots.txt                # generated
```

The generated files are committed so the site can be deployed without a
build step on the host. If you'd rather not commit them, add the
generated paths to `.gitignore` and configure your host to run
`node build.js` as the build command.

---

## Things to swap in

The bundled work entries, writing entries, and contact details are
placeholders. Replace them with your own:

- Edit `content/<track>/{work,writing}/*.md` — or delete and add fresh ones.
- Replace the article placeholder bodies with the real pieces.
- Update the contact links in `build.js` (`renderTrackPage`) — currently
  hardcoded to `mailto:ayoola@example.com` and the example LinkedIn URL.
- Update `site.config.json` with your real details.
