# Deploy RJL Fencing & Gates to Netlify

Same workflow as the commercial site at rjlcommercialgroup.com.

## Recommended: connect the GitHub repository

1. Open [https://app.netlify.com](https://app.netlify.com) and choose **Add new project** → **Import an existing project**.
2. Select the `rjl-fencing-and-gates` GitHub repository.
3. Netlify reads `netlify.toml`:
   - Build command: `npm run build:netlify`
   - Publish directory: `dist/client`
   - Node version: `22.13.0`
4. Deploy, then test the generated `netlify.app` address.

## Connect rjlfencingandgates.com.au

After the Netlify address works:

1. Open **Domain management** in the Netlify project.
2. Add `rjlfencingandgates.com.au` and `www.rjlfencingandgates.com.au`.
3. Follow the DNS records Netlify shows.
4. Keep existing Google Workspace MX and verification records unchanged.

## Commercial sibling site

Enterprise work stays on [rjlcommercialgroup.com](https://www.rjlcommercialgroup.com). This project is the residential arm only.
