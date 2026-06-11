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

## Custom domain: stockgame.rhymage.com

At the DNS provider for `rhymage.com`, create this record:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | `stockgame` | `rhymage.github.io` |

Then:

1. Open the repository's **Settings > Pages**.
2. Enter `stockgame.rhymage.com` under **Custom domain** and save.
3. Wait for the DNS check to pass.
4. Enable **Enforce HTTPS** when the option becomes available.

Do not use a wildcard DNS record for this setup. Keep the repository public
while using GitHub Pages on the GitHub Free plan.

## Data refresh

Run the following command, review the changed JSON files, then commit and push:

```powershell
node scripts/fetch-daily.mjs
git add public/data
git commit -m "Refresh market data"
git push
```

Refreshing data can change stock indexes and invalidate existing challenge links.

