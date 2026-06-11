# Deployment

## Repository conventions

- Repository name: lowercase kebab-case, describing one deployable product
- Default branch: `main`
- Static site source: `public/`
- Maintenance scripts: `scripts/`
- Operational documentation: `docs/`
- Automation: `.github/workflows/`

This repository deploys `public/` to GitHub Pages whenever `main` is updated.

## GitHub Pages

1. Open the repository's **Settings > Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Run the **Deploy GitHub Pages** workflow or push to `main`.
4. The default site URL is `https://rhymage.github.io/stockgame/`.

## Shared custom domain

The user Pages repository `rhymage/rhymage.github.io` owns the shared custom
domain `app.rhymage.com`. Project Pages repositories automatically become
available under their repository-name path.

- This app: `https://app.rhymage.com/stockgame/`
- Future app pattern: `https://app.rhymage.com/<repository-name>/`

The shared DNS record is:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | `app` | `rhymage.github.io` |

Do not set a separate custom domain in each project repository. Keep project
sites compatible with subpaths by using relative asset URLs or URLs prefixed
with the repository path.

## Data refresh

Run the following command, review the changed JSON files, then commit and push:

```powershell
node scripts/fetch-daily.mjs
git add public/data
git commit -m "Refresh market data"
git push
```

Refreshing data can change stock indexes and invalidate existing challenge links.
