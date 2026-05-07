# SEO Automation MVP

> A 1-day, mock-first SEO automation side project built with Google Sheets + Apps Script.

This repo is the cleaned-up interview version of a small automation MVP: take a keyword from a Google Sheet, inspect the top SERP results, extract recurring entities, then generate a structured SEO article brief with image prompts and quality notes.

The point is not "AI magic." The point is reducing a boring repeated workflow into something a non-technical teammate can actually use in the tool they already live in: Google Sheets.

## MVP scope

This project intentionally does four things only:

- read the first pending SERP task from `SERP_Input`
- write top-10 SERP rows plus heuristic entities into `SERP_Results`
- read the first pending SEO task from `SEO_Input`
- write one article package into `SEO_Output`

Everything else is deliberately out of scope for the demo.

## Why Google Sheets + Apps Script

This was a product choice, not just a fast hack.

- The target user is a non-technical SEO/content teammate.
- Google Sheets already acts like their inbox, backlog, and results table.
- Apps Script gives zero-infra automation with no backend, auth, or deployment overhead.
- For an MVP, "the sheet is the UI" is a strength, not a limitation.

The tradeoff is obvious: weaker schema enforcement, Apps Script runtime limits, and fewer engineering niceties than a full app. For a one-day demoable MVP, that tradeoff is worth it.

## System architecture

```text
Google Sheet
├── SERP_Input   -> analyzeSerpEntities()  -> SERP_Results
└── SEO_Input    -> generateSeoContent()   -> SEO_Output

SERP flow:
pending row -> SERP API or mock data -> top-10 organic results
-> Chinese bigrams + English tokens + stopword filter
-> append 10 rows -> mark source row done/error

SEO flow:
pending row -> structured prompt -> OpenAI/Anthropic or mock response
-> parse ===SECTION=== blocks
-> append article + 3 image prompts + quality notes
-> mark source row done/error

Optional next-step path:
n8n workflow mirrors the same read -> process -> write flow.
```

## Mock-first design

The most important product decision here is that the demo works with zero API keys.

- `SERP_MOCK_MODE=true`
- `SEO_MOCK_MODE=true`

With both flags enabled, the full demo runs offline using canned SERP results and a canned SEO response. That makes the project reliable in interviews and easy to understand without external dependencies.

When needed, live APIs can be enabled later through Script Properties.

## Repo structure

```text
seo-automation-mvp/
├── apps-script/
│   ├── serp_entity_analyzer.gs
│   └── seo_content_generator.gs
├── n8n/
│   └── seo_content_generator.workflow.json
├── README.md
├── DEMO_SCRIPT.md
└── .gitignore
```

## Demo flow

### 1. SERP entity extraction

1. Create a `SERP_Input` sheet with the schema below.
2. Add one row:
   - `keyword = 狗糧推薦`
   - `status = pending`
3. Run `analyzeSerpEntities()`.
4. Confirm:
   - `SERP_Results` gets 10 rows
   - `SERP_Input.status` becomes `done`
   - logs show `[SERP]` progress lines

### 2. SEO content generation

1. Create an `SEO_Input` sheet with the schema below.
2. Add one row:
   - `keyword = 狗糧推薦`
   - `product = ProPlan`
   - `scenario = 室內小型犬`
   - `status = pending`
3. Run `generateSeoContent()`.
4. Confirm:
   - `SEO_Output` gets 1 row
   - article, 3 image prompts, and quality notes are filled
   - `SEO_Input.status` becomes `done`
   - logs show `[SEO]` progress lines

## Sheet schemas

### `SERP_Input`

| keyword | status | error_message | updated_at |
| --- | --- | --- | --- |

### `SERP_Results`

| timestamp | input_row | keyword | position | title | link | snippet | top_entities | token_count | mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### `SEO_Input`

| keyword | product | scenario | status | error_message | updated_at |
| --- | --- | --- | --- | --- | --- |

### `SEO_Output`

| timestamp | input_row | keyword | product | scenario | article | image_prompt_25 | image_prompt_50 | image_prompt_75 | quality_notes | mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Header order matters because Apps Script writes rows positionally. Both scripts validate output headers at runtime before writing, so a broken sheet fails loudly instead of silently misaligning data.

## Setup

1. Open a Google Sheet.
2. Create four tabs:
   - `SERP_Input`
   - `SERP_Results`
   - `SEO_Input`
   - `SEO_Output`
3. Copy the schemas above into row 1.
4. Open `Extensions -> Apps Script`.
5. Paste:
   - `apps-script/serp_entity_analyzer.gs`
   - `apps-script/seo_content_generator.gs`
6. Leave `SERP_MOCK_MODE = true` and `SEO_MOCK_MODE = true`.
7. Run each function once to approve permissions.

## Live API configuration

Only needed if you want real API calls instead of the mock path.

| Property | Purpose |
| --- | --- |
| `SERP_API_KEY` | SerpAPI or ValueSERP key |
| `SERP_PROVIDER` | `serpapi` or `valueserp` |
| `SERP_LOCATION` | optional location override |
| `SERP_LANGUAGE` | optional language override |
| `SERP_COUNTRY` | optional country override |
| `LLM_API_KEY` | OpenAI or Anthropic API key |
| `LLM_PROVIDER` | `openai` or `anthropic` |

Set them in `Apps Script -> Project Settings -> Script Properties`.

## What’s done

- mock-first SERP entity analyzer
- mock-first SEO content generator
- output header validation to prevent silent sheet corruption
- status machine: `pending -> processing -> done/error`
- execution logs for demo visibility
- starter n8n workflow matching the same pipeline
- interview-friendly demo script

## What’s intentionally not done

- real NLP entity extraction
- batch processing of multiple rows per run
- dedupe strategy for repeated runs
- source-row update in the n8n workflow
- image generation itself
- custom frontend, auth, database, or dashboard

This is an MVP repo, not a production SaaS.

## Future expansion ideas

- replace heuristic entities with Cloud Natural Language or LLM-based extraction
- add batch processing with a configurable limit
- promote the n8n workflow into a scheduled background runner
- add structured JSON outputs for the LLM path
- add dedupe keys for repeated jobs

## 2-minute interview demo

If you only have two minutes:

1. Show one pending row in `SERP_Input`.
2. Run `analyzeSerpEntities()` and show 10 rows appear in `SERP_Results`.
3. Show the source row changed to `done`.
4. Show one pending row in `SEO_Input`.
5. Run `generateSeoContent()` and show the article package appear in `SEO_Output`.
6. End on this sentence:

> "I chose Google Sheets + Apps Script on purpose so a non-technical teammate could use the workflow immediately, and I kept mock mode on by default so the demo is reliable even with zero API keys."

For a full script and Q&A prep, see [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).
