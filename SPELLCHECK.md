# Spelling and grammar checks (planned, not set up yet)

Goal: catch typos and comma/grammar mistakes in the site's copy before it goes live.

Grammarly isn't an option: it shut down its developer SDK and API in January 2024, and it never checked source files.

## Plan

1. **cspell for spelling.** Free, built for code. Install it as a dev dependency in `client/` and `management/`,
   add a `cspell.json` with a word list for names it won't know (the business name, Turnstile, Supabase, Stripe…),
   and an `npm run spellcheck` script covering `src/**/*.{ts,tsx}`. Optionally run it in a pre-commit hook or CI.
   The "Code Spell Checker" VS Code extension shows the same errors while editing.
2. **LanguageTool for grammar and commas.** cspell only checks spelling. LanguageTool is free and open source; run
   it locally (Docker or Java) so there are no rate limits and the text stays on this machine. Write a small script
   that pulls the visible text out of the screens and components (Home, About, Packages, Services, FAQ list, area
   pages, etc.), sends it to the local LanguageTool server, and prints each issue with its file and line. Its free
   rules catch common comma mistakes (after an introductory phrase, comma splices, around "which"); no tool catches
   every comma choice, so treat its output as suggestions.

Other options looked at: Harper (free, offline, fewer punctuation rules than LanguageTool) and Vale (style rules for
Markdown docs, not useful for text inside components).
