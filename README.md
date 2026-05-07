# SEO Automation MVP

> A one-day, mock-first SEO automation side project built for live demo: Google Sheets + Apps Script + n8n + Supabase + a tiny Vercel UI.

This project turns two repetitive SEO tasks into a compact end-to-end workflow:

1. analyze Google's first-page results for any keyword and count/group entities
2. generate a draft SEO article package from keyword + product + scenario

It is intentionally an interview-ready MVP, not a polished SaaS product.

## What the MVP does

### 1. SERP entity analyzer

- input any keyword from `SERP_Input`
- fetch top-10 organic results from SerpAPI or ValueSERP
- support full offline demo with `SERP_MOCK_MODE=true`
- extract simple Chinese/English entities with a heuristic tokenizer
- count entities per article
- assign a lightweight theme group per result
- write all 10 results into `SERP_Results`

### 2. SEO content generator

- input keyword + product + scenario + optional output folder from `SEO_Input`
- generate an article, 3 image prompts, quality notes, and a revised article
- insert image markers at 25% / 50% / 75%
- output placeholder image URLs for demo stability
- support full offline demo with `SEO_MOCK_MODE=true`
- write the package into `SEO_Output`

### 3. Supporting layers

- `n8n/` contains an importable workflow that mirrors the same read/process/write flow
- `scripts/generate_entity_report.py` turns a CSV export of `SERP_Results` into a visual entity report
- `supabase/schema.sql` adds minimal storage for run logs
- `web/` is a small Vercel-ready control panel with Supabase auth

## Why this stack

### Why Google Sheets + Apps Script

Because the actual user in this story is not an engineer.

Google Sheets already works as:

- the request inbox
- the operator console
- the results table

Apps Script makes the automation deployable in minutes with no server, no auth setup, and no DevOps overhead.

### Why mock-first

Because live demos fail in the most boring ways:

- missing API keys
- network issues
- rate limits
- provider response drift

So both core flows default to mock mode:

- `SERP_MOCK_MODE=true`
- `SEO_MOCK_MODE=true`

That means the whole demo can run with zero external credentials.

### Why Supabase + Vercel anyway

Because the interview prompt also asks for deployment, storage, and login.

So instead of overbuilding a full product, this repo adds the thinnest possible outer layer:

- Supabase for auth and run logging
- Vercel for a tiny control panel

The Sheet and Apps Script remain the actual MVP core.

## Repo structure

```text
seo-automation-mvp/
├── apps-script/
│   ├── serp_entity_analyzer.gs
│   └── seo_content_generator.gs
├── n8n/
│   └── seo_content_generator.workflow.json
├── scripts/
│   └── generate_entity_report.py
├── supabase/
│   └── schema.sql
├── web/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── config.example.js
├── assets/
├── README.md
├── DEMO_SCRIPT.md
└── .gitignore
```

## System architecture

```text
Google Sheet
├── SERP_Input  -> analyzeSerpEntities() -> SERP_Results
└── SEO_Input   -> generateSeoContent()  -> SEO_Output

Apps Script
├── custom menu buttons inside Google Sheets
├── status machine: pending -> processing -> done/error
└── mock/live switches via Script Properties

n8n
├── manual trigger or schedule trigger
├── read Google Sheets
├── call SERP / LLM
└── append results back to Sheets

Supabase
├── email/password auth
├── serp_runs table
└── seo_runs table

Vercel UI
├── sign in / sign up
├── queue SERP / SEO runs
├── open Sheet / n8n / repo links
└── show recent run history

Python script
└── reads SERP_Results CSV export and generates an entity report HTML chart
```

## Sheet schema

### `SERP_Input`

| keyword | status | error_message | updated_at |
| --- | --- | --- | --- |

### `SERP_Results`

| timestamp | input_row | keyword | position | title | link | snippet | top_entities | entity_count | entity_theme | mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### `SEO_Input`

| keyword | product | scenario | output_folder | status | error_message | updated_at |
| --- | --- | --- | --- | --- | --- | --- |

### `SEO_Output`

| timestamp | input_row | keyword | product | scenario | article | image_prompt_25 | image_prompt_50 | image_prompt_75 | article_with_images | image_url_25 | image_url_50 | image_url_75 | quality_notes | improvement_points | revised_article | output_folder | mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Setup

### A. Google Sheets + Apps Script

1. Create a Google Sheet with four tabs:
   - `SERP_Input`
   - `SERP_Results`
   - `SEO_Input`
   - `SEO_Output`
2. Copy the headers above into row 1.
3. Open `Extensions -> Apps Script`.
4. Paste:
   - `apps-script/serp_entity_analyzer.gs`
   - `apps-script/seo_content_generator.gs`
5. Leave:
   - `SERP_MOCK_MODE = true`
   - `SEO_MOCK_MODE = true`
6. Run each function once to authorize permissions.
7. Reload the sheet and use the custom menu: `SEO MVP -> Run SERP Analyzer` or `Run SEO Generator`.

### B. n8n

1. Self-host n8n or use an existing instance.
2. Import `n8n/seo_content_generator.workflow.json`.
3. Configure:
   - Google Sheets credentials
   - `SERP_API_KEY`
   - `LLM_API_KEY`
4. Optional:
   - create webhook URLs and paste them into `web/config.js`

### C. Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Enable Email auth.
4. Copy:
   - project URL
   - anon key

### D. Vercel

1. Deploy the `web/` folder as a static site on Vercel
2. Copy `web/config.example.js` to `web/config.js`
3. Fill in:
   - Supabase URL
   - Supabase anon key
   - Google Sheet URL
   - repo URL
   - n8n URL
   - optional webhook URLs

## Demo flow

### SERP demo

1. In `SERP_Input`, add:
   - `keyword = 4G吃到飽`
   - `status = pending`
2. Run `analyzeSerpEntities()`
3. Show:
   - top 10 results
   - `entity_count` per row
   - `entity_theme` grouping
   - source row changed to `done`

### SEO demo

1. In `SEO_Input`, add:
   - `keyword = 4G吃到飽`
   - `product = 中華電信 4G 吃到飽`
   - `scenario = 學生遠距上課與影音使用`
   - `output_folder = telecom-content`
   - `status = pending`
2. Run `generateSeoContent()`
3. Show:
   - article
   - image prompts
   - inserted image markers
   - quality notes
   - 3 improvement points
   - revised article

### Chart demo

Export `SERP_Results` as CSV, then run:

```bash
python3 scripts/generate_entity_report.py path/to/serp_results.csv assets/entity-report.html
```

Open `assets/entity-report.html` to show the grouped entity chart.

## 2-minute interview version

If time is short:

1. Open the Vercel page and show sign-in + run queue UI
2. Open the Google Sheet and run the SERP flow
3. Show `entity_count` and `entity_theme`
4. Run the SEO flow and show `article_with_images`
5. End with:

> "The core workflow lives in Google Sheets + Apps Script because that is the fastest usable interface for a non-technical teammate. Supabase and Vercel are just the light outer shell for login, storage, and demo polish."

## What is finished

- SERP entity analyzer with arbitrary keyword input
- entity count per result
- lightweight theme grouping per result
- SEO content generator with article, image prompts, quality notes, improvement points, and revised article
- image insertion markers at 25% / 50% / 75%
- output folder support
- Google Sheets custom menu as a real clickable control
- n8n starter workflow
- Supabase schema for auth + run logging
- Vercel-ready static UI
- Python chart generation script

## What is still intentionally lightweight

- entity grouping is heuristic, not true NLP clustering
- image URLs are placeholder demo assets, not generated creative
- the Vercel UI logs and triggers runs, but the Sheet remains the source of truth
- n8n still needs final credential wiring and optional row-update nodes
- there is no full production sync loop between Apps Script, Supabase, and n8n

That is deliberate. This repo is optimized for clarity, demo reliability, and product thinking under one-day constraints.

## Future directions

- replace heuristic entity parsing with embeddings or Cloud Natural Language
- generate real images from prompts and upload them to storage
- sync Apps Script outputs back into Supabase automatically
- add scheduled batch processing
- expand the Vercel UI into a proper dashboard

## Files worth showing in an interview

- `apps-script/serp_entity_analyzer.gs`
- `apps-script/seo_content_generator.gs`
- `n8n/seo_content_generator.workflow.json`
- `supabase/schema.sql`
- `web/index.html` and `web/app.js`
- `DEMO_SCRIPT.md`
