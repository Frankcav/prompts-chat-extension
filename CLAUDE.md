# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser extension (Chrome & Firefox) that enhances prompts.chat with additional features. It's built using WXT (Web Extension Toolkit) with React, TypeScript, and TailwindCSS. The extension allows users to browse AI prompts and send them directly to various AI platforms (ChatGPT, Claude, Gemini, etc.) with one click.

## Development Commands

```bash
# Development
yarn dev                    # Start dev server for Chrome
yarn dev:firefox            # Start dev server for Firefox
yarn compile                # Type-check without emitting

# Building
yarn build                  # Build for Chrome
yarn build:firefox          # Build for Firefox
yarn zip                    # Create distribution zip for Chrome
yarn zip:firefox            # Create distribution zip for Firefox

# Testing
yarn test                   # Run unit tests (Vitest)
yarn test:run               # Run tests once without watch
yarn test:ui                # Run tests with Vitest UI
yarn test:coverage          # Generate coverage report
yarn test:e2e               # Run E2E tests (Playwright)
yarn test:e2e:ui            # Run E2E tests with UI
```

## Architecture

### Extension Entry Points (WXT Architecture)

WXT uses a file-based convention for extension entry points in `src/entrypoints/`:

- **`background.ts`**: Service worker handling cross-origin messaging between popup/sidepanel and content scripts. Manages the "Run on AI" feature by:
  - Opening new tabs with AI platform URLs (with querystring support when available)
  - Sending messages to content scripts to insert prompts into existing tabs
  - Waiting for tabs to load before injecting content

- **`content.ts`**: Content script injected into AI platform pages (ChatGPT, Claude, etc.). Listens for `insertPrompt` messages and injects prompt text into the platform's input field using platform-specific selectors.

- **`popup/`**: Main extension UI (popup window)
- **`sidepanel/`**: Side panel UI (Chrome MV3 only)

### Data Flow

1. **Prompt Fetching**: `src/lib/api.ts` fetches prompts from `https://prompts.otrochat.com/prompts.json` with 5-minute cache
2. **State Management**: `PromptsContext.tsx` provides global state using React Context + TanStack Query
3. **Storage**: Uses WXT's storage wrapper (`@wxt-dev/storage`) for cross-browser storage with sync/local areas
4. **Messaging**: Uses `@webext-core/messaging` for type-safe extension messaging between background and content scripts

### Platform Integration (`src/lib/constants.ts`)

The extension supports multiple AI platforms defined in `CHAT_PLATFORMS` and `CODE_PLATFORMS`. Each platform has:
- `inputSelector`: CSS selector for the platform's input field (used by content script)
- `supportsQuerystring`: Whether the platform accepts prompts via URL querystring
- `isDeeplink`: Whether it's a deep link protocol (e.g., `cursor://`, `vscode://`)

The `buildPlatformUrl()` function handles platform-specific URL formatting.

### Key Components

- **`PromptsList.tsx`**: Virtualized list of prompts using `@tanstack/react-virtual`
- **`HighlightedContent.tsx`**: Syntax highlighting for structured prompts using Shiki
- **Variable Substitution** (`src/lib/utils/prompts.ts`): Prompts can contain `{variables}` or `{{variables}}` that users can customize before sending

## White Label Configuration

The extension is configured as a white-labeled version for "otrochat.com":
- Brand name: "prompts.otrochat.com" (see `wxt.config.ts` and `package.json`)
- API endpoint: `https://prompts.otrochat.com/prompts.json`
- Includes OtroChat as first platform in chat platforms list

## Testing

- **Unit tests**: Located in `tests/unit/` and `tests/components/`, run with Vitest + React Testing Library
- **E2E tests**: Located in `tests/e2e/`, run with Playwright (Chrome only, loads built extension)
- Unit tests exclude UI components from coverage (`src/components/ui/**` are shadcn/ui components)

## Browser Compatibility

- **Chrome**: Manifest V3 with sidePanel permission
- **Firefox**: Manifest V2 with gecko-specific settings (ID: `extension@otrochat.com`)
- Build outputs go to `.output/chrome-mv3/` or `.output/firefox-mv2/`

## Release Process

Uses semantic-release for automated versioning and releases. Version is managed in `package.json` and synced to extension manifest automatically.
