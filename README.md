# Should I Work Out Today?

> A multilingual motivational website that always gives you one answer: **yes, you should work out today.**

**Should I Work Out Today?** gives you a quick push whenever motivation is low. Click the button or press the space bar to get another reason to train.

The project is inspired by the simple and playful concept behind [shouldideploy.today](https://shouldideploy.today), reimagined for fitness with an original visual identity, multilingual motivational messages, and shareable Story cards.

## Features

- A new motivational message on every click
- Keyboard interaction with the space bar
- Light and dark themes
- Language preference saved in the browser
- Responsive layout for mobile and desktop
- Optional interaction sound
- Native mobile sharing when supported
- Automatic 1080 × 1920 image generation for Instagram Stories, WhatsApp, and other platforms
- No frameworks, dependencies, build step, or tracking

## Languages

The complete interface and motivational message collection are available in:

| Language | Code |
| --- | --- |
| Portuguese | `pt` |
| English | `en` |
| Spanish | `es` |
| German | `de` |
| Italian | `it` |
| French | `fr` |
| Japanese | `ja` |
| Korean | `ko` |
| Simplified Chinese | `zh` |

The selected language and theme are stored locally and restored on the next visit.

## Getting started

Clone the repository:

```bash
git clone git@github.com:mthrodrigues301/should-i-work-out-today.git
cd should-i-work-out-today
```

Open `index.html` directly in your browser, or run a local static server:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## How it works

All motivational messages and translations live in the `localeData` object inside `script.js`. The application randomly selects a message in the active language and avoids showing the same one twice in a row.

The sharing feature draws the current answer, label, message, and attribution onto an HTML canvas. On compatible mobile browsers, the generated PNG is passed to the native share menu. On unsupported browsers, the image is downloaded instead.

> Native sharing works best when the website is served over HTTPS. Browsers may restrict it when `index.html` is opened through a local `file://` URL.

## Add a translation

1. Add a new option to the language selector in `index.html`.
2. Add the matching locale entry to `localeData` in `script.js`.
3. Translate the interface labels, feedback messages, main “yes” answer, and motivational messages.
4. Test the regular layout and the generated Story image with both themes.

## Project structure

```text
.
├── index.html    # Page structure and accessibility markup
├── styles.css    # Responsive design, animations, and themes
├── script.js     # Messages, translations, interactions, and sharing
└── README.md
```

## Deployment

This is a static website and can be deployed directly to GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any other static hosting provider.

For GitHub Pages, open the repository settings, go to **Pages**, choose **Deploy from a branch**, and select the `main` branch and the root folder.

## Credits

- Concept inspired by [baires/shouldideploy](https://github.com/baires/shouldideploy)
- Designed and developed by [Matheus Rodrigues](https://github.com/mthrodrigues301)

## Contributing

Suggestions, translation improvements, and new motivational messages are welcome. Open an issue or submit a pull request with your proposal.
