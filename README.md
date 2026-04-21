# TouchGrass

TouchGrass is a simple MVP website for Singapore users to join or host small
real-life activity groups of 4 to 6 people.

The current setup includes:

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- Supabase client integration
- A simple landing page
- Starter folders for `app`, `components`, `lib`, and `types`

Auth is not built yet. For now, Supabase is only connected and tested.

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

This project also supports the older key name below, because some Supabase
projects still use it:

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

After changing `.env.local`, restart the dev server.

## Folder Structure

```text
app/
  create-group/
    page.tsx
  groups/
    [id]/
      actions.ts
      page.tsx
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
lib/
  home-content.ts
  server/
    temporary-user.ts
  supabase/
    activity-groups.ts
    check-connection.ts
    client.ts
    group-details.ts
supabase/
  migrations/
    20260421_add_max_members_to_activity_groups.sql
    20260421_create_group_members.sql
    20260422_create_meetup_slots_and_availability_votes.sql
    20260422_add_user_id_to_group_members.sql
types/
  home.ts
.env.example
```

## What Each Folder Is For

- `app`: Next.js routes, layouts, and route pages
- `components`: Reusable UI pieces
- `lib`: Shared helpers and project logic
- `lib/supabase`: Supabase setup code
- `types`: Shared TypeScript types

## Supabase Files

- `lib/supabase/client.ts`: Creates the Supabase client using `.env.local`
- `lib/supabase/activity-groups.ts`: Fetches activity groups from Supabase
- `lib/supabase/check-connection.ts`: Runs a simple connection check
- `app/supabase-test/page.tsx`: Shows whether Supabase is connected
- `app/supabase-test/actions.ts`: Handles create-group and join-group form submissions
- `app/groups/page.tsx`: Real MVP page for browsing groups
- `app/groups/[id]/page.tsx`: Group details page with members and meetup slots
- `app/groups/[id]/actions.ts`: Handles creating meetup slots and availability votes
- `app/create-group/page.tsx`: Real MVP page for creating groups
- `lib/server/temporary-user.ts`: Shared temporary user cookie helper
- `components/groups/group-card.tsx`: Shared group card UI
- `components/groups/group-form.tsx`: Shared create-group form UI
- `supabase/migrations/20260421_add_max_members_to_activity_groups.sql`: SQL to add the `max_members` column
- `supabase/migrations/20260421_create_group_members.sql`: SQL to create the `group_members` table
- `supabase/migrations/20260422_create_meetup_slots_and_availability_votes.sql`: SQL to create meetup slots and availability votes
- `supabase/migrations/20260422_add_user_id_to_group_members.sql`: SQL to add a stable temporary `user_id` column
- `.env.example`: Template for the environment variables you need

## Command To Recreate This Starter From Scratch

If you want to generate the same kind of project in a fresh folder, run:

```bash
npx create-next-app@latest touchgrass --ts --tailwind --eslint --app --empty --use-npm
cd touchgrass
npm install
npm install @supabase/supabase-js
```

## Next Suggested Step

After this setup, the next practical milestone is adding Supabase auth,
database tables, and realtime chat.
