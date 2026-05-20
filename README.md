# Michelle Artistry

Static portfolio site for Michelle Artistry with Supabase-backed artwork management and a local admin dashboard.

## Local Development

Open the site with a static server from the project root.

```bash
npx serve .
```

## Deployment

This repository is ready for Vercel. Set these environment variables in Vercel for the admin and upload scripts:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `IMAGEKIT_URL_ENDPOINT`

Keep `admin-creds.json` and `.env` out of the public repo.

## Branding

The site uses the Michelle Artistry logo for the favicon and social previews, and includes the footer credit link requested by the owner.
