# Spelling and grammar checks

These catch typos and comma/grammar mistakes in the site's copy before it goes live. Both run from `client/`.

The same checks for every repo in `~/SideWork`, with a pre-commit hook and a Claude skill, live in
`~/SideWork/copycheck` (run `copycheck` anywhere). The scripts below stay so this repo works on its own.

Grammarly isn't an option: it shut down its developer SDK and API in January 2024, and it never checked source files.

## Spelling: cspell

```bash
npm run spellcheck
```

Checks `src/**/*.{ts,tsx}`. When it flags a name or identifier that is spelled right, add it to `words` in
`client/cspell.json`. The "Code Spell Checker" VS Code extension reads the same config and shows the errors while
editing.

## Grammar and commas: LanguageTool

`client/scripts/grammar.mjs` pulls the visible text out of `src/` (JSX text, titles, ledes, package and FAQ copy, the
email templates), sends each piece to a LanguageTool server on this machine, and prints every issue with its file and
line. Text never leaves the machine and there are no rate limits. Start the server once (Docker; it keeps running
until stopped):

```bash
docker run -d --name languagetool -p 8010:8010 erikvl87/languagetool
```

Then:

```bash
npm run grammar
```

- `npm run grammar -- src/screens/Home.tsx` checks one file.
- `npm run grammar -- --list` prints the extracted text without checking it.
- `LANGUAGETOOL_URL` points it at another server (default `http://localhost:8010`).

Spelling rules are turned off (cspell covers spelling), along with a few rules that misfire on short UI labels.
`{expressions}` inside text show up as `X`. Its rules catch common comma mistakes (after an introductory phrase,
comma splices, around "which"), but no tool catches every comma choice, so treat the output as suggestions.

Other options looked at: Harper (free, offline, fewer punctuation rules than LanguageTool) and Vale (style rules for
Markdown docs, not useful for text inside components).

## Not set up

- `management/` has no spell check: it still signs in through the old Supabase project, which is gone, so it's no
  longer used.
- Neither check runs in a pre-commit hook or CI yet.
