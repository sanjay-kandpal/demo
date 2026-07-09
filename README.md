# Next.js Project Setup

This repository was initialized as a Next.js project using:

- `npm`
- JavaScript
- App Router (`app/` directory)
- ESLint
- No Tailwind CSS

## Quick Start

Install dependencies (already done during initialization):

```bash
npm install
```

Run in development:

```bash
npm run dev
```

Run checks/build for release workflows:

```bash
npm run lint
npm run build
```

Run production server after build:

```bash
npm run start
```

## Project Notes

- Main page entry point: `app/page.js`
- Local development URL: [http://localhost:3000](http://localhost:3000)
- Build sanity check was completed successfully after setup
- The default Next.js starter homepage has been replaced with the ADHA Home Loan Eligibility Calculator UI from `ui_pages/homepage.html`, now implemented as a React page in `app/page.js`
- Header branding on `app/page.js` now uses the requested `skip-contrast` logo link element (`/en`) instead of a plain text-only logo wrapper
- Header branding now renders the provided ADHA image (`/-/media/Project/ADHA/ADHA/Header/Adha-Logo---Website7.png`) inside the `skip-contrast` logo link
- The header logo image is now served locally from `public/Adha_Logo.png` to avoid external path 404 issues in local dev
- Material Symbols icons (e.g. `arrow_forward` on the Check Eligibility button) now render correctly via `font-family` on `.material-symbols-outlined` in `app/globals.css`
- The Check Eligibility button uses an inline SVG arrow icon instead of Material Symbols text, so the forward arrow always renders as a symbol
