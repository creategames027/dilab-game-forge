# DiLab Game Forge

A standalone, browser-based game generator for the Pollinations community quest #20021.

## Start locally

Double-click `start.cmd` on Windows, or run `npm start` (Node.js 22+). Open http://localhost:8765.
No dependencies or API key in the repository. The included Orbit Runner demo, preview and share features work without sign-in.

## Generate a game

1. Connect Pollinations using its OAuth authorization flow (PKCE).
2. Approve a scoped text-generation key and a spending cap.
3. Describe a game, select a text model and Generate.
4. Play, restart, revise, inspect the HTML, download or copy a portable link.

Generation and revisions spend the connected user's balance, not the developer's. Optional one-shot automatic repair is disabled by default. Asset generation is explicit and separate. Music and sound effects use currently paid-only models and require the user to confirm. Generated assets are embedded in the game and exported HTML; very large assets can prevent URL sharing. The default consent cap is $1, editable on the provider consent screen. Only connect accounts eligible under the provider's terms. Disconnect clears the local token; revoke it in the Pollinations dashboard if desired.

## Deploy on GitHub Pages (no backend)

1. Run `npm run build` (or double-click `Publish-Pages.cmd`). This copies only the eight browser assets to `docs/` and creates `.nojekyll`.
2. Push this project to its own public GitHub repository, including the generated `docs/` directory.
3. In the repository, go to Settings > Pages > Build and deployment. Select "Deploy from a branch", branch `main`, folder `/docs`, then Save.
4. Open the public HTTPS URL shown by GitHub Pages. Confirm the demo works, connect an eligible Pollinations account, and explicitly authorize a limited budget before trying generation.
5. After updates, rebuild and push. GitHub Pages needs no Node server, API proxy, database, or secrets.

All asset paths are relative, so repository subpaths work. The callback URL is the actual page URL without query or fragment. Pollinations Pay authorization-code + PKCE works in a static browser app; an App Key is optional. To identify the app by name, create a publishable `pk_` App Key, register the exact HTTPS callback URL, put only that public key in `config.js`, and rebuild. Never commit an `sk_` key.

Run `npm run test:pages` to check the published assets in an Edge browser under a GitHub Pages-style repository subpath with mocked OAuth and API calls.

Share links encode compressed HTML in the URL fragment; they work on the same deployed host without a server or account. Long links may exceed some messaging services' limits. Download HTML as an alternative. Localhost links are local-only until the app is hosted publicly.

## Asset lab and gallery

Generate textures with Z-Image Turbo, instrumental music with Eleven Music, and sound effects with Eleven Text to Sound via Pollinations. The generator receives the names of available embedded assets (not their bytes); game code can use window.FORGE_ASSETS. Three local games are included. Optional one-shot repair detects invalid HTML or initial runtime errors, not every possible gameplay bug.

## Security

OAuth uses state and S256 PKCE, keeps the scoped user token in sessionStorage and never sends it to a game. Generated game code runs in an opaque-origin sandboxed iframe with restrictive CSP (no network requests or external assets). The preview is untrusted code; it cannot read the parent page or token. Do not enter private information in generated games. Downloaded HTML is isolated by CSP, but should still be treated as untrusted content. No analytics, ads or hidden API calls.

## Tests

`npm test` runs the core validation, share compression and PKCE tests. Live OAuth and model generation require an eligible user's authorization and are not included in automated tests.

## Quest

https://github.com/pollinations/pollinations/issues/20021
Official Pollinations Pay guide:
https://github.com/pollinations/pollinations/blob/main/BRING_YOUR_OWN_POLLEN.md

A public repository, publicly hosted live demo and maintainer approval are required before any reward can be claimed.
