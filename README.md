# BB Chief

BB Chief is a lightweight web application for tracking Blood Bowl matches.

It is designed to be used by both players on a shared mobile device or tablet, making it easy to keep track of the match without interrupting gameplay.

## Project Status

BB Chief is currently under development.

The core match management functionality and unit tests have been implemented. The application is still subject to improvements, particularly in its user interface and overall user experience.

## Features

- Match setup for standard Blood Bowl and Sevens formats.
- Team configuration, including team names, races, and initial rerolls.
- Selection of the kicking team.
- Touchdown tracking.
- Turn management and automatic alternation between teams.
- Half-time and end-of-match management.
- Reroll tracking and manual corrections.
- Undo of the last action.
- Spanish and English interface.
- Responsive interface for mobile devices and tablets.
- Local match persistence using browser storage.
- Saved match recovery when reopening the application.

## Technologies

The project is built using:

- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vue Router](https://router.vuejs.org/)
- [Vue I18n](https://vue-i18n.intlify.dev/)
- [Vitest](https://vitest.dev/) for unit testing.
- [Playwright](https://playwright.dev/) for end-to-end testing.
- [ESLint](https://eslint.org/) and [Oxlint](https://oxc.rs/docs/guide/usage/linter) for linting.
- [Prettier](https://prettier.io/) for code formatting.

## Requirements

To run the project locally, you need:

- [Node.js](https://nodejs.org/) `^22.18.0` or `>=24.12.0`, as specified in the `engines` field of `package.json`.
- npm.
- Git.

## Installation

Clone the repository:

```bash
git clone https://github.com/foruiz/bb-chief.git
```

Navigate to the project directory:

```bash
cd bb-chief
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

By default, Vite makes the development server available on your local machine.

To access it from another device on the same local network, run:

```bash
npm run dev -- --host 0.0.0.0
```

Then open the URL displayed by Vite in your mobile device or tablet.

**Security note:** Only expose the development server to trusted local networks. Do not make it publicly accessible.

## Available Commands

| Command              | Description                                         |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Starts the development server.                      |
| `npm run test:unit`  | Runs the unit tests.                                |
| `npm run test:e2e`   | Runs the end-to-end tests.                          |
| `npm run type-check` | Runs TypeScript type checking.                      |
| `npm run build`      | Checks types and builds the production application. |
| `npm run preview`    | Serves the production build locally.                |
| `npm run lint`       | Runs Oxlint and ESLint, applying automatic fixes.   |
| `npm run format`     | Formats the source code in `src/` with Prettier.    |

## Match Data and Persistence

BB Chief stores match data locally in the browser using local storage.

This means:

- Match data remains available on the same device and browser.
- No user account or remote server is required.
- Match data is not automatically synchronized between devices.
- Clearing browser data or local storage may permanently delete saved matches.

**Important:** There is currently no automatic backup or cloud synchronization. If you change devices or clear your browser data, your saved matches may be lost.

## Ruleset

BB Chief is designed around the Blood Bowl Third Season Edition (2025) ruleset. The Sevens format is defined in the Spike! Journal Issue 22 supplement, and the application includes it.

The application is intended as a match-tracking tool. It does not replace the official rulebook, calculate every game situation, or enforce all tabletop rules.

Players remain responsible for applying the official rules correctly.

## Disclaimer

BB Chief is an independent, fan-made project.

Blood Bowl and all related names, logos, artwork, and intellectual property are the property of Games Workshop Limited.

This project is not affiliated with, endorsed by, or sponsored by Games Workshop Limited.

## Contributions

BB Chief is currently maintained exclusively by its original author.

External code contributions and pull requests are not accepted at this time.

If you find a bug or have an idea for improvement, you are welcome to open an issue describing the problem or suggestion.

Please include steps to reproduce the issue whenever possible.

All decisions regarding the official repository and its development remain under the control of the project maintainer.

## Attribution

BB Chief is an independent open-source project.

If you fork, clone, or redistribute this project, I kindly ask you to:

- Preserve the original copyright and license notices.
- Acknowledge the original BB Chief project and its author.
- Include a link to the original repository whenever reasonably possible.
- Clearly identify any modifications made to the original project.

Original repository: https://github.com/foruiz/bb-chief

These attribution requests do not impose additional restrictions on the rights granted by the GPL-3.0-or-later license.

## License

BB Chief is licensed under the **GNU General Public License v3.0 or later (GPL-3.0-or-later)**.

You may use, study, modify, and redistribute this software under the terms and conditions of the GPL-3.0 license, or, at your option, any later version published by the Free Software Foundation.

Copyright (C) 2026 Fº Javier Olmedo Ruiz

See the [`LICENSE`](LICENSE) file for the complete license text.

The original copyright notices and license notices must be preserved when redistributing the project, as required by the license.

## Credits and third-party licenses

This project uses icons from [Game-icons.net](https://game-icons.net), licensed under
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/):

- **American football helmet** by [Delapouite](https://delapouite.com), modified.
  Source: https://game-icons.net/1x1/delapouite/american-football-helmet.html

- **Confrontation** by [Delapouite](https://delapouite.com), unmodified.
  Source: https://game-icons.net/1x1/delapouite/confrontation.html

Icons from [Lucide](https://lucide.dev) are used under the
[ISC License](https://github.com/lucide-icons/lucide/blob/main/LICENSE):

> ISC License
>
> Copyright (c) 2026 Lucide Icons and Contributors
>
> Permission to use, copy, modify, and/or distribute this software for any
> purpose with or without fee is hereby granted, provided that the above
> copyright notice and this permission notice appear in all copies.
>
> THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
> WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
> MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
> ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
> WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
> ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
> OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
