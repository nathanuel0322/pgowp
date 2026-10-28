---
name: grammar-check
description: Spelling and grammar check of this repo's changes with the copycheck CLI, fixing the real mistakes. Run it when the user types /grammar-check, and before every commit, push or deploy (pushing master deploys the site).
argument-hint: "[paths | all]"
---

# /grammar-check

Checks spelling (cspell, with the word list in `cspell.json`) and grammar (LanguageTool in Docker) with `copycheck`,
then fixes what's actually wrong. The git hooks in `.githooks/` run the same check, warning only, on every commit
and push. This command is the step that fixes what they find.

1. **Pick the text to check.**
   - With paths: `copycheck <paths>`.
   - With `all`: `copycheck` (the whole repo). Save the output to the scratchpad, since a full run is long.
   - With no arguments: everything not yet on GitHub, `copycheck --since origin/master`. Run `git fetch` first if
     `origin/master` might be stale.
   - If `copycheck` isn't installed (it lives in `~/SideWork/copycheck`), say so and stop. Grammar needs Docker
     Desktop running. copycheck starts the LanguageTool container itself, which can take a minute the first time.
2. **Spelling.**
   - Fix real typos in the source.
   - Add correct names, places and terms to `cspell.json` `words`, sorted alphabetically.
   - Add a pattern to `ignoreRegExpList` for IDs and hashes. Never put them in `words`.
3. **Grammar.**
   - Fix clear mistakes in user-facing copy: missing hyphens in compound adjectives, a/an, apostrophes, doubled
     words, wrong word forms.
   - List optional style suggestions for the user instead of applying them, unless the text is Claude's own
     wording that it is about to commit (for example a CLAUDE.md or commit-adjacent doc edit).
   - Ignore hits on code, CSS or placeholder text pulled out of source.
4. **Recheck** the touched files with `copycheck <files>` until only accepted suggestions remain. For copy changes in
   `client/`, also run `npx tsc -b` there.
5. **Report** what you fixed, and which suggestions you left and why. Fixes go in the commit being made, or in their
   own commit when the check runs on its own. Don't push unless the user asked.
