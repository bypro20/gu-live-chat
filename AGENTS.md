<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Production deploy

- **Do not** run `npx vercel --prod` from the local workspace — it uploads untracked folders and can break TypeScript build.
- **Do** commit + `git push origin master` (Vercel Git auto-deploy) or `npm run deploy:prod` (GitHub master via Vercel API).
