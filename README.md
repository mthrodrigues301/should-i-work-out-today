# Should I Work Out Today?

> A multilingual motivational website that always gives you one answer: **yes, you should work out today.**

**Should I Work Out Today?** gives you a quick push whenever motivation is low. Click the button or press the space bar to get another reason to train.

The project is inspired by the simple and playful concept behind [shouldideploy.today](https://shouldideploy.today), reimagined for fitness with an original visual identity, multilingual motivational messages, and shareable Story cards.

## Features

- A new motivational message on every click
- Keyboard interaction with the space bar
- Light and dark themes
- Language preference saved in the browser
- Browser-language detection on the first visit
- Indexable language URLs such as `/pt`, `/en`, and `/ja`
- Responsive layout for mobile and desktop
- Optional interaction sound
- Opt-in daily motivational push notifications
- Native mobile sharing when supported
- Automatic 1080 × 1920 image generation for Instagram Stories, WhatsApp, and other platforms
- Story card, transparent PNG, and text-only sharing modes
- No frontend framework
- Privacy-first, consent-gated analytics and performance monitoring

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
Opening the root domain automatically selects the closest supported browser language. A language chosen manually is reflected in the URL and takes priority on future visits.

## Getting started

Clone the repository:

```bash
git clone git@github.com:mthrodrigues301/should-i-work-out-today.git
cd should-i-work-out-today
```

Install the dependencies and run a local static server:

```bash
npm install
npm start
```

Then visit [http://localhost:3000](http://localhost:3000).

## How it works

Each language lives in its own file inside `src/locales/`. The application loads the translations, randomly selects one of 50 messages in the active language, and avoids showing the same one twice in a row.

The sharing feature draws the current answer, label, message, and attribution onto an HTML canvas. On compatible mobile browsers, the generated PNG is passed to the native share menu. On unsupported browsers, the image is downloaded instead.

> Native sharing works best when the website is served over HTTPS. Browsers may restrict it when `index.html` is opened through a local `file://` URL.

## Add a translation

1. Add a new option to the language selector in `src/index.html`.
2. Create the matching translation file inside `src/locales/`, using an existing locale as a template.
3. Translate the interface labels, feedback messages, main “yes” answer, and motivational messages.
4. Test the regular layout and the generated Story image with both themes.

## Project structure

```text
.
├── src/                 # Application source code
│   ├── index.html       # Page template, metadata, and accessibility
│   ├── privacy.html     # Privacy policy
│   ├── language-redirect.html
│   ├── styles/          # Responsive design, animations, and themes
│   ├── scripts/         # Interactions and consent-gated analytics
│   ├── locales/         # One translation file per language
│   └── assets/          # Source files transformed during the build
├── public/              # Static files copied directly to production
│   ├── assets/          # Public brand assets and favicon
│   ├── manifest.webmanifest
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/build.mjs    # Generates the production site in dist/
├── dist/                # Generated output (not committed)
├── vercel.json         # Vercel build, routing, and security headers
└── README.md
```

## Deployment

This static website is configured for Vercel through `vercel.json`, including localized pre-rendering, clean URLs, security headers, and production redirects.

The Open Graph PNG is generated from `src/assets/og-image.svg` during the build and is intentionally not committed to the repository.

Import the repository into Vercel and keep the framework preset as **Other**. Vercel reads the build and output settings from `vercel.json`. The production domain used by canonical URLs, social metadata, `robots.txt`, and the sitemap is [shouldiworkout.today](https://shouldiworkout.today).

### Daily notifications

Daily Web Push is sent at 12:00 UTC (09:00 in São Paulo) by a Vercel Cron job. Configure an Upstash Redis database and copy `.env.example` to `.env.local` for local development. Generate VAPID keys with `npx web-push generate-vapid-keys` and add all six variables to the Vercel project.

On iPhone and iPad, Web Push requires iOS/iPadOS 16.4 or newer and the website must first be added to the Home Screen. Notification permission is requested only after the visitor presses the daily reminder button.

> Vercel's Hobby plan is intended for non-commercial personal use. Review the current Vercel plan terms before enabling advertising, affiliate links, sponsorships, or paid features.

## SEO

- Localized URLs and `hreflang` annotations for all nine languages
- Unique titles and descriptions for each language
- Canonical URLs
- Open Graph and X/Twitter social cards
- `WebSite` structured data
- XML sitemap and `robots.txt`
- Semantic HTML and responsive design
- Pre-rendered HTML for every supported language
- Consent-gated Vercel Web Analytics and Speed Insights

Before collecting traffic or performance data, enable **Web Analytics** and **Speed Insights** in the Vercel project dashboard and deploy the site again. The application only injects these services after the visitor grants Analytics consent. Advertising integrations remain disabled and must use the existing `data-consent="ads"` mechanism.

## Credits

- Concept inspired by [baires/shouldideploy](https://github.com/baires/shouldideploy)
- Designed and developed by [Matheus Rodrigues](https://github.com/mthrodrigues301)

## Contributing

Suggestions, translation improvements, and new motivational messages are welcome. Open an issue or submit a pull request with your proposal.

## License

The original source code is available under the [MIT License](LICENSE). Third-party names, quotations, film references, and attributed material are excluded from that license and remain the property of their respective rights holders. See [NOTICE](NOTICE) for details.
