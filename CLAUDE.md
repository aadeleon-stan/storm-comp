# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CompareDeezBalls** — a web app for comparing Storm bowling ball reaction specs side-by-side. The Storm website only shows one ball's reaction graphic at a time; this tool lets users compare multiple balls simultaneously.

### Reaction Spec Graphic Format
Each ball's specs are displayed as bars with 11 cells, with the ball's value highlighted across one or more contiguous cells. Known metrics include:
- **Ball Shape**: smooth (left) → angular (right)
- **Hook Length**: early (left) → mid-lane (center) → late (right)
- **Lane Condition**: fresh → transition → burn (left to right)

Additional metrics exist and must be read from Storm product pages — the list above is not exhaustive, but metrics are consistent across all relevant products.

## MVP Scope

1. **Database**: Reaction specs for all current Storm-brand balls
2. **Data Ingestion**: Accept a Storm product page URL → validate it's a ball with reaction specs → parse the graphic → store specs in DB
3. **Search**: Query DB for bowling balls
4. **Comparison View**: Display reaction spec graphics for 2+ balls simultaneously

## Architecture

No code exists yet — this is a greenfield project. Key decisions to make before scaffolding:
- **Frontend framework** for the comparison UI
- **Database** for storing ball specs (data is static; only updated when new balls release)
- **Scraping/parsing approach** for reading reaction spec graphics from Storm product pages
- **Hosting** for the web app and DB
