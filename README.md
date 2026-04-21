# TouchGrass

TouchGrass is a simple MVP website for Singapore users to join or host small
real-life activity groups of 4 to 6 people.

The current setup includes:

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- Supabase client integration
- Supabase email/password auth
- Public member profiles
- Group creator/admin permissions
- A member dashboard for joined groups and slot invites
- A simple landing page

## Prerequisites

- Node.js 20.9 or newer

## Commands To Run In This Project

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open these pages in your browser:

- `http://localhost:3000`
- `http://localhost:3000/groups`
- `http://localhost:3000/create-group`
- `http://localhost:3000/login`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/profile`
- `http://localhost:3000/supabase-test`

Run linting:

```bash
npm run lint
```

If you are using Windows PowerShell and `npm` is blocked by execution policy,
use `npm.cmd` instead:

```bash
npm.cmd install
npm.cmd run dev
```

## Supabase Environment Variables

Create a `.env.local` file in the project root.

Recommended variable names:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

This project also supports the older key name below:

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

After changing `.env.local`, restart the dev server.

## Supabase Auth Setup

In the Supabase dashboard:

1. Go to `Authentication` -> `Providers` and enable Email.
2. Set your site URL in `Authentication` -> `URL Configuration`.
3. Add your local and production URLs there.

Common values:

- Local site URL: `http://localhost:3000`
- Production site URL: your Vercel domain

## Folder Structure

```text
app/
  auth/
    signout/
      route.ts
  create-group/
    page.tsx
  dashboard/
    page.tsx
  groups/
    [id]/
      actions.ts
      page.tsx
    page.tsx
  login/
    actions.ts
    page.tsx
  profile/
    actions.ts
    page.tsx
  profiles/
    [id]/
      page.tsx
  globals.css
  layout.tsx
  page.tsx
  supabase-test/
    actions.ts
    page.tsx
components/
  groups/
    group-card.tsx
    group-form.tsx
  home/
  site-header.tsx
lib/
  home-content.ts
  server/
    temporary-user.ts
  supabase/
    activity-groups.ts
    auth.ts
    check-connection.ts
    client.ts
    dashboard.ts
    errors.ts
    group-details.ts
    memberships.ts
    profiles.ts
    proxy.ts
    server.ts
supabase/
  migrations/
    20260421_add_max_members_to_activity_groups.sql
    20260421_create_group_members.sql
    20260422_add_user_id_to_group_members.sql
    20260422_create_meetup_slots_and_availability_votes.sql
    20260422_add_auth_profiles_permissions_and_dashboard.sql
types/
  home.ts
  profile.ts
.env.example
proxy.ts
```

## What Each Folder Is For

- `app`: Next.js routes, layouts, and route pages
- `components`: Reusable UI pieces
- `lib`: Shared helpers and project logic
- `lib/supabase`: Supabase setup code and auth/data helpers
- `types`: Shared TypeScript types

## Supabase Files

- `lib/supabase/client.ts`: Creates the browser Supabase client using `.env.local`
- `lib/supabase/server.ts`: Creates the server Supabase client for App Router pages and actions
- `lib/supabase/proxy.ts`: Refreshes auth cookies inside `proxy.ts`
- `lib/supabase/auth.ts`: Shared helpers for login state and protected pages
- `lib/supabase/profiles.ts`: Loads and ensures public member profiles
- `lib/supabase/memberships.ts`: Shared group membership and permission checks
- `lib/supabase/dashboard.ts`: Loads joined groups and invited meetup slots
- `lib/supabase/errors.ts`: Shared Supabase error helpers
- `lib/supabase/activity-groups.ts`: Fetches activity groups from Supabase
- `lib/supabase/check-connection.ts`: Runs a simple connection check
- `lib/supabase/group-details.ts`: Loads group details, members, and slot availability
- `app/supabase-test/actions.ts`: Handles create-group and join-group form submissions with auth-aware writes
- `app/groups/[id]/actions.ts`: Handles meetup slot creation, availability votes, and invite acceptance
- `supabase/migrations/20260422_add_auth_profiles_permissions_and_dashboard.sql`: SQL to add auth-ready profiles, permissions, and slot acceptances

## Command To Recreate This Starter From Scratch

If you want to generate the same kind of project in a fresh folder, run:

```bash
npx create-next-app@latest touchgrass --ts --tailwind --eslint --app --empty --use-npm
cd touchgrass
npm install
npm install @supabase/supabase-js @supabase/ssr
```

## Next Suggested Step

After this setup, the next practical milestone is adding richer role
management, event confirmation flows, and realtime chat.
