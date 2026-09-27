# uts: murmur. newsstand

A magazine-rack interface for browsing the
[uts: murmur.](https://pechat.substack.com/) archive. It is a Next.js app that
syncs public Substack archive data, popularity order, and cover images into
local snapshots so the site remains useful if Substack is temporarily
unavailable.

## Local runbook

Requires Node.js 20 or newer.

```bash
npm install
npm run sync:snapshot
npm run sync:popular
npm run sync:covers
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Before shipping a change,
run:

```bash
npm test
npm run build
```

## Refreshing the archive

When new posts appear on Substack, regenerate and commit the checked-in data
and covers:

```bash
npm run sync:snapshot
npm run sync:popular
npm run sync:covers
npm test
npm run build
```

Run the commands in that order: the popularity and cover syncs use the current
archive snapshot. Review the generated changes before committing them.

## Configuration

Set `NEXT_PUBLIC_SITE_URL` to the site's canonical absolute URL, for example
`https://your-project.vercel.app`. It is used as the metadata base for social
sharing links. On Vercel, deployments fall back automatically to
`VERCEL_URL`; local builds fall back to the publication's Substack URL.

The publication identity and Substack endpoints live in `lib/publication.ts`.
This app uses public Substack data only. It does not use Notion, a reader
submissions database, or an AI API key.

## Deploying to Vercel

Import the GitHub repository into Vercel and use the default Next.js build
settings. Add `NEXT_PUBLIC_SITE_URL` after the production domain is known, then
redeploy so canonical social metadata uses it. Vercel supplies a free
`*.vercel.app` URL; a custom domain is optional.

For a CLI deployment:

```bash
npx vercel --yes
npx vercel --prod --yes
```

The first command links the project and creates a preview deployment. The
second promotes a production deployment. Run `npx vercel login` first if the
CLI requests authentication.

## Reusable guide

The original reusable brief remains available in
[`substack_newsstand_build_guide.md`](substack_newsstand_build_guide.md).
