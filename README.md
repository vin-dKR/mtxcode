# Keycraft

Keycraft is a React practice workbench for developers. The landing page opens into a featured Code Check: start typing in the editor, follow the faint reference in place, and get a report automatically when the code matches. The report shows pace and suggests a short retry around a line that slowed you down. Use Ctrl/Cmd+S to finish early. The drill library offers open topic paths for language review and interview algorithms. Write from memory in Blind, or run behavior checks in Repair Lab and supported interview drills.

## Run locally

Use Node.js 22.12 or later with npm.

```sh
npm ci
npm run dev
```

Run `npm run check` to type-check the app. Run `npm run build` for a production build in `dist/`, then use `npm run preview` to serve it locally. Static hosts can serve the same build. Open it through an HTTP server so the browser can load its ES modules.

## Project layout

- `src/features/landing` contains the featured prompt and live playground.
- `src/features/library` contains the roadmap, topic and language filters, saved drills, and command palette.
- `src/features/practice` contains the editor lifecycle, run state, results, and replay chart.
- `src/features/history` contains activity, filters, and replay links.
- `src/features/settings` contains themes, editor settings, and the generated Vim command reference.
- `src/core` contains challenge data, scoring, CodeMirror integration, and the isolated repair checker.
- `src/components/ui.tsx` contains shared UI primitives. `src/theme.css` defines the palettes and editor colors.

The editor, progress view, and settings load as separate chunks. The TypeScript compiler loads when a TypeScript repair runs. Repair checks run locally in disposable workers inside an isolated frame. Progress, favorites, ghosts, and preferences use browser storage.

To update the Vim command reference after changing the Vim package version, run `node src/features/settings/generate-vim-reference.mjs`.

## Add content

Give each drill a stable ID and a topic, then add a solution keyed by language ID. The catalog derives the languages offered for each drill. Weekend exercises include an original solution and a link to the corresponding prompt in the [JS Weekend question set](https://brindle-goal-102.notion.site/QUESTIONS-FOR-JS-WEEKEND-26d46b36b2e980a0b299fbf0d87840af).

To add a language, register its ID, names, file extension, and editor adapter in `src/core/languages.ts`. Add the corresponding CodeMirror adapter in `src/core/editor.ts` and provide solutions using the new ID. Filters, editor language choices, deep links, and history read the registry. Behavior checks also require a compatible runtime adapter.

The project and original exercises use the MIT license. Bundled dependencies keep their own licenses in `public/third-party-notices.txt`.
# mtxcode
