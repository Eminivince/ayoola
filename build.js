#!/usr/bin/env node
/*
 * Static site builder for the personal portfolio.
 *
 * Reads markdown files from content/ and regenerates index.html, law.html,
 * and engineering.html. Run with:  node build.js
 *
 * Layout:
 *   content/<track>/_intro.md         position statement (body only)
 *   content/<track>/work/*.md         work entries (frontmatter)
 *   content/<track>/writing/*.md      writing entries (frontmatter)
 *
 * Frontmatter fields:
 *   year      display string ("2024" or "Mar 2025"), required
 *   title     entry title, required
 *   desc      one-line description, required
 *   italic    true to wrap title in <em> (case names, paper titles)
 *   href      link target (defaults to "#")
 *   also_in   writing only: "law" or "engineering" — duplicates the entry
 *             onto the other track's page with a cross-track annotation
 *
 * Entries are sorted by filename, descending. Use date-prefixed names like
 * 2024-08-foo.md so newest entries appear first naturally.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content');

const TRACKS = ['law', 'engineering'];
const LABEL = { law: 'Law', engineering: 'Engineering' };
const OTHER = { law: 'engineering', engineering: 'law' };

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '');
    if (!line) continue;
    const km = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!km) continue;
    let v = km[2].trim();
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else v = v.replace(/^"(.*)"$|^'(.*)'$/, (_, a, b) => a !== undefined ? a : b);
    meta[km[1]] = v;
  }
  return { meta, body: m[2] };
}

function loadDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .sort()
    .reverse()
    .map(f => {
      const { meta } = parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8'));
      return { ...meta, _file: f };
    });
}

function loadIntro(track) {
  const file = path.join(CONTENT, track, '_intro.md');
  if (!fs.existsSync(file)) return '';
  const { body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  return body.trim();
}

const sources = {};
for (const t of TRACKS) {
  sources[t] = {
    intro: loadIntro(t),
    work: loadDir(path.join(CONTENT, t, 'work')),
    writing: loadDir(path.join(CONTENT, t, 'writing')),
  };
}

function renderTitleLink(e) {
  const href = e.href || '#';
  const t = esc(e.title);
  const inner = e.italic ? `<em>${t}</em>` : t;
  return `<a href="${esc(href)}">${inner}</a>`;
}

function renderWorkEntry(e) {
  return `        <li class="entry">
          <span class="entry-year">${esc(e.year)}</span>
          <div class="entry-body">
            <span class="entry-title">${renderTitleLink(e)}</span>
            <span class="entry-desc">${esc(e.desc)}</span>
          </div>
        </li>`;
}

function renderWritingEntry(e) {
  const annotation = e.annotation
    ? `\n            <span class="entry-track">${esc(e.annotation)}</span>`
    : '';
  return `        <li class="entry writing">
          <span class="entry-year">${esc(e.year)}</span>
          <div class="entry-body">
            <span class="entry-title">${renderTitleLink(e)}</span>
            <span class="entry-desc">${esc(e.desc)}</span>${annotation}
          </div>
        </li>`;
}

function pageEntries(track) {
  const other = OTHER[track];
  const work = sources[track].work.slice();
  const writing = sources[track].writing.map(e => ({
    ...e,
    annotation: e.also_in ? `Also in ${LABEL[e.also_in]}` : null,
  }));
  for (const e of sources[other].writing) {
    if (e.also_in === track) {
      writing.push({ ...e, annotation: `Also in ${LABEL[other]}` });
    }
  }
  const byFile = (a, b) => (a._file < b._file ? 1 : a._file > b._file ? -1 : 0);
  work.sort(byFile);
  writing.sort(byFile);
  return { work, writing };
}

function introHtml(track) {
  const intro = sources[track].intro;
  if (!intro) return '';
  return intro
    .split(/\n\s*\n/)
    .map(p => `      <p class="prose">\n        ${esc(p.trim()).replace(/\n/g, '\n        ')}\n      </p>`)
    .join('\n');
}

function renderTrackPage(track) {
  const label = LABEL[track];
  const other = OTHER[track];
  const otherLabel = LABEL[other];
  const { work, writing } = pageEntries(track);
  const writingAria = track === 'engineering' ? 'Technical writing' : 'Legal writing';
  const workAria = `Selected ${track === 'law' ? 'legal' : 'engineering'} work`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ayoola Olaoye — ${label}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <div class="container">
    <nav class="site-nav">
      <a class="bare back" href="index.html">Ayoola Olaoye</a>
      <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle dark mode">dark</button>
    </nav>
  </div>

  <!-- ─── HEADER ─── -->
  <div class="container">
    <header class="page-header">
      <h1 style="font-size:1.9rem; font-weight:400; letter-spacing:-0.015em; line-height:1.2; margin-bottom:0;">${label}</h1>
      <hr>
    </header>
  </div>

  <!-- ─── POSITION ─── -->
  <div class="container">
    <section class="section" style="padding-top:0;" aria-label="Practice statement">
${introHtml(track)}
    </section>
  </div>

  <div class="container"><hr></div>

  <!-- ─── SELECTED WORK ─── -->
  <div class="container">
    <section class="section" aria-label="${workAria}">
      <span class="label">Selected work</span>
      <ul class="entry-list" role="list">

${work.map(renderWorkEntry).join('\n\n')}

      </ul>
    </section>
  </div>

  <div class="container"><hr></div>

  <!-- ─── WRITING ─── -->
  <div class="container">
    <section class="section" aria-label="${writingAria}">
      <span class="label">Writing</span>
      <ul class="entry-list" role="list">

${writing.map(renderWritingEntry).join('\n\n')}

      </ul>
    </section>
  </div>

  <div class="container"><hr></div>

  <!-- ─── CONTACT ─── -->
  <div class="container">
    <section class="section" aria-label="Contact">
      <span class="label">Contact</span>
      <ul class="contact-links" role="list">
        <li><a href="mailto:ayoola@example.com">ayoola@example.com</a></li>
        <li><a href="https://linkedin.com/in/ayoolaolaoye" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
      </ul>
    </section>
  </div>

  <!-- ─── CROSS-LINK ─── -->
  <div class="container">
    <hr>
    <div class="cross-link">
      <a href="${other}.html">${otherLabel} →</a>
    </div>
  </div>

  <script>
    (function () {
      if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        document.querySelector('.theme-toggle').textContent = 'light';
      }
    })();

    function toggleTheme() {
      const btn = document.querySelector('.theme-toggle');
      if (document.body.classList.toggle('dark')) {
        localStorage.setItem('theme', 'dark');
        btn.textContent = 'light';
      } else {
        localStorage.setItem('theme', 'light');
        btn.textContent = 'dark';
      }
    }
  </script>

</body>
</html>
`;
}

function buildSearchIndex() {
  const out = [];
  for (const e of sources.law.work) {
    out.push({ year: String(e.year), title: e.title, desc: e.desc, track: 'Law', href: 'law.html', italic: !!e.italic });
  }
  for (const e of sources.engineering.work) {
    out.push({ year: String(e.year), title: e.title, desc: e.desc, track: 'Engineering', href: 'engineering.html', italic: !!e.italic });
  }
  for (const t of TRACKS) {
    for (const e of sources[t].writing) {
      const cross = e.also_in && TRACKS.includes(e.also_in);
      const label = cross ? `${LABEL[t]} + ${LABEL[e.also_in]}` : LABEL[t];
      out.push({ year: String(e.year), title: e.title, desc: e.desc, track: label, href: `${t}.html`, italic: !!e.italic });
    }
  }
  return out;
}

function renderIndexPage() {
  const data = buildSearchIndex();
  const indexJson = JSON.stringify(data, null, 6)
    .replace(/^/gm, '    ')
    .trimStart();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ayoola Olaoye</title>
  <link rel="stylesheet" href="style.css">
  <style>
    /* ─── SEARCH ─── */
    .search-wrap {
      margin-top: 3rem;
      width: 100%;
      position: relative;
    }

    .search-input {
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--rule);
      color: var(--ink);
      font-family: var(--font);
      font-size: 0.95rem;
      line-height: 1.6;
      padding: 0.35rem 0;
      outline: none;
      letter-spacing: 0.01em;
      transition: border-color 0.2s ease;
    }

    .search-input::placeholder {
      color: var(--muted);
    }

    .search-input:focus {
      border-bottom-color: var(--ink);
    }

    .search-results {
      margin-top: 1.5rem;
      width: 100%;
      text-align: left;
      display: none;
    }

    .search-results.visible {
      display: block;
    }

    .search-result-item {
      padding: 0.55rem 0;
      border-top: 1px solid #e4e3dc;
      display: grid;
      grid-template-columns: 3.5rem 1fr;
      gap: 0 1.25rem;
      align-items: baseline;
    }

    .search-result-item:last-child {
      border-bottom: 1px solid #e4e3dc;
    }

    .search-result-year {
      font-size: 0.82rem;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .search-result-body {
      display: flex;
      flex-direction: column;
      gap: 0.08rem;
    }

    .search-result-title {
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .search-result-title a {
      text-decoration: none;
      color: var(--ink);
    }

    .search-result-title a:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
      text-decoration-thickness: 1px;
    }

    .search-result-meta {
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.4;
      margin-bottom: 0.15rem;
      white-space: nowrap;
    }

    .search-result-track {
      letter-spacing: 0.06em;
      font-size: 0.78rem;
    }

    .search-result-desc {
      font-size: 0.82rem;
      color: #7a7a74;
      line-height: 1.45;
    }

    .search-empty {
      font-size: 0.88rem;
      color: var(--muted);
      padding: 0.5rem 0;
    }

    /* dark mode overrides for search */
    body.dark .search-result-item {
      border-top-color: #2a2926;
    }
    body.dark .search-result-item:last-child {
      border-bottom-color: #2a2926;
    }
    body.dark .search-result-desc {
      color: #76756f;
    }


  </style>
</head>
<body>

  <button class="landing-toggle" onclick="toggleTheme()" aria-label="Toggle dark mode">dark</button>

  <div class="landing-stage">
    <div class="landing-inner">
      <h1 class="landing-name">Ayoola Olaoye</h1>
      <p class="landing-descriptor">Corporate lawyer. Software engineer.</p>
      <nav class="landing-fork" aria-label="Practice areas">
        <a href="law.html">Law</a>
        <span class="landing-divider" aria-hidden="true"></span>
        <a href="engineering.html">Engineering</a>
      </nav>

      <div class="search-wrap">
        <input
          class="search-input"
          type="search"
          placeholder="Search works, writing…"
          autocomplete="off"
          spellcheck="false"
          aria-label="Search"
          id="search-input"
        >
      </div>

      <div class="search-results" id="search-results" role="region" aria-live="polite" aria-label="Search results"></div>
    </div>
  </div>

  <script>
    /* ─── CONTENT INDEX (generated by build.js from content/) ─── */
    const INDEX = ${indexJson};

    function search(query) {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return INDEX.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.track.toLowerCase().replace('+', 'and').includes(q) ||
        item.track.toLowerCase().includes(q) ||
        item.year.toLowerCase().includes(q)
      );
    }

    function renderResults(results, query) {
      const container = document.getElementById('search-results');
      if (!query.trim()) {
        container.classList.remove('visible');
        container.innerHTML = '';
        return;
      }
      container.classList.add('visible');
      if (results.length === 0) {
        container.innerHTML = '<p class="search-empty">No results.</p>';
        return;
      }
      container.innerHTML = results.map(item => \`
        <div class="search-result-item">
          <span class="search-result-year">\${item.year}</span>
          <div class="search-result-body">
            <span class="search-result-title">
              <a href="\${item.href}">\${item.italic ? \`<em>\${item.title}</em>\` : item.title}</a>
            </span>
            <div class="search-result-meta">
              <span class="search-result-track">\${item.track}</span>
            </div>
            <span class="search-result-desc">\${item.desc}</span>
          </div>
        </div>
      \`).join('');
    }

    document.getElementById('search-input').addEventListener('input', function () {
      renderResults(search(this.value), this.value);
    });

    /* ─── THEME ─── */
    (function () {
      if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        document.querySelector('.landing-toggle').textContent = 'light';
      }
    })();

    function toggleTheme() {
      const btn = document.querySelector('.landing-toggle');
      if (document.body.classList.toggle('dark')) {
        localStorage.setItem('theme', 'dark');
        btn.textContent = 'light';
      } else {
        localStorage.setItem('theme', 'light');
        btn.textContent = 'dark';
      }
    }
  </script>

</body>
</html>
`;
}

function write(file, contents) {
  fs.writeFileSync(path.join(ROOT, file), contents);
  console.log(`wrote ${file}`);
}

write('index.html', renderIndexPage());
for (const t of TRACKS) write(`${t}.html`, renderTrackPage(t));
