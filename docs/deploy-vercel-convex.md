# Deploy With Vercel And Convex

This project should deploy through Vercel, not GitHub Pages.

## Vercel Project

1. Import `https://github.com/oscanog/melvz` in Vercel.
2. Use the repository root as the project root.
3. Keep the checked-in `vercel.json` build settings.

The Vercel build command is:

```bash
npx convex deploy --cmd-url-env-var-name VITE_CONVEX_URL --cmd 'npm run build'
```

Convex deploys the backend functions, injects `VITE_CONVEX_URL` for the Vite build, then Vercel serves `dist`.

## Required Vercel Env

Set this in Vercel project environment variables:

```text
CONVEX_DEPLOY_KEY=<production deploy key from Convex>
```

For preview deployments, use a Convex preview deploy key in Vercel Preview environment.

## Required Convex Env

Set this in the Convex production deployment:

```text
ADMIN_PASSCODE=<private admin passcode>
```

## Notes

- Do not set `VITE_CONVEX_URL` manually in Vercel when using this build command.
- Do not commit deploy keys or passcodes.
- If `/#admin` says Convex is not configured, check the Vercel build logs for the Convex deploy step.
