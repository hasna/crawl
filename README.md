# @hasna/crawl

AI-powered web crawler — self-hosted Firecrawl alternative. Crawl, extract, render JS, search. CLI + MCP + REST API + Dashboard.

[![npm](https://img.shields.io/npm/v/@hasna/crawl)](https://www.npmjs.com/package/@hasna/crawl)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

## Install

```bash
npm install -g @hasna/crawl
```

## CLI Usage

```bash
crawl --help
```

- `crawl crawl <url>`
- `crawl list`
- `crawl stats`
- `crawl search <query>`
- `crawl sitemap <url>`
- `crawl map <url>`
- `crawl export`

### Output defaults

CLI commands use compact human output by default so agent terminals do not fill
with full records or page bodies. List-style commands show the most useful
columns, cap rows, truncate long text, and print a hint for the next detail
command.

Use these flags when you need more:

- `--limit <n>` and `--offset <n>` page through list/search output.
- `--verbose` adds secondary fields such as timestamps, crawl options, or
  payload previews.
- `crawl get <page-id>` shows a short page preview; `crawl get <page-id> --full`
  prints complete page content.
- `crawl map <url>` and `crawl sitemap <url>` preview discovered URLs; use
  `--show <n>`, `--all`, or `--json` for more.
- `--json` keeps machine-readable output for scripts. Sensitive or bulky webhook
  fields stay redacted by default; use explicit flags such as
  `--include-secret`, `--include-secrets`, or `--include-payloads` only when the
  full values are needed.

## MCP Server

```bash
crawl-mcp
```

30 tools available.

MCP tools also prefer compact responses by default. Tools that can return large
page bodies, URL lists, webhook payloads, or scraped search results expose
explicit detail arguments such as `format: "full"`, `full: true`, `content_limit`,
`show`, `all`, `offset`, `verbose`, or `include_payloads`. Paginated tools return
`nextOffset` when more results are available.

## HTTP mode

Long-lived Streamable HTTP transport for shared agent sessions (binds `127.0.0.1` only):

```bash
crawl-mcp --http              # default port 8812
crawl-mcp --http --port 8812
MCP_HTTP=1 MCP_HTTP_PORT=8812 crawl-mcp
```

- `GET /health` → `{"status":"ok","name":"crawl"}`
- `POST /mcp` — Streamable HTTP MCP endpoint (also mounted on `crawl-serve`)

Stdio remains the default transport for gradual rollout.

## REST API

```bash
crawl-serve
```

## Cloud Sync

This package supports cloud sync via `@hasna/cloud`:

```bash
cloud setup
cloud sync push --service crawl
cloud sync pull --service crawl
```

## Data Directory

Data is stored in `~/.hasna/crawl/`.

## License

Apache-2.0 -- see [LICENSE](LICENSE)
