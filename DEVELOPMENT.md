# AI Call Assistant - Development Guide

This guide will help you set up the project for local development.

## Prerequisites

- **Node.js**: v18 or higher ([install with nvm](https://github.com/nvm-sh/nvm))
- **npm** or **bun**: Package manager
- **Supabase CLI**: For local database development (optional)
- **Git**: Version control

## Project Structure

```
ai-call-assistant/
├── src/
│   ├── components/        # React components
│   │   ├── calls/        # Call-specific components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # React hooks
│   ├── integrations/     # External service integrations
│   │   └── supabase/     # Supabase client & types
│   ├── lib/              # Utility libraries
│   │   ├── auth.tsx      # Authentication context
│   │   ├── admin.functions.ts  # Server functions
│   │   ├── vapi.server.ts      # Vapi integration
│   │   └── format.ts     # Formatting utilities
│   ├── routes/           # TanStack Router pages
│   │   ├── _authenticated/  # Protected routes
│   │   ├── api/          # API routes
│   │   ├── __root.tsx    # Root layout
│   │   ├── index.tsx     # Landing page
│   │   └── login.tsx     # Login page
│   ├── styles.css        # Global styles & theme
│   └── router.tsx        # Router configuration
├── supabase/
│   ├── migrations/       # Database migrations
│   └── config.toml       # Supabase configuration
├── public/               # Static assets
├── .env                  # Environment variables (local)
├── .env.example          # Example environment variables
└── package.json          # Dependencies & scripts
```

## Technology Stack

- **Frontend Framework**: React 19 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Voice AI**: Vapi.ai
- **Notifications**: Sonner

## Initial Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai-call-assistant
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using bun (faster)
bun install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

For full functionality, add these secret keys (for development only):

```env
VAPI_PRIVATE_KEY=your_vapi_key
VAPI_ASSISTANT_ID=your_assistant_id
VAPI_SERVER_SECRET=your_webhook_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: Never commit `.env` file to git!

### 4. Set Up the Database

#### Option A: Use Your Supabase Cloud Project

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations (see DEPLOYMENT.md)
3. Get your credentials from Settings → API

#### Option B: Use Local Supabase (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# This will output local credentials - update your .env
```

### 5. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Development Workflow

### Running the App

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Database Development

#### Viewing Types

The database types are auto-generated in:

```
src/integrations/supabase/types.ts
```

If you modify the database schema, regenerate types:

```bash
# If using Supabase CLI
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Or from a cloud project
supabase gen types typescript --project-ref your-project-ref > src/integrations/supabase/types.ts
```

#### Creating Migrations

```bash
# Create a new migration file
supabase migration new your_migration_name

# Edit the SQL file in supabase/migrations/
# Then apply it
supabase db push
```

## Key Concepts

### Authentication Flow

1. Users sign in via `/login`
2. Supabase Auth creates a session
3. `AuthProvider` loads user profile and role
4. Protected routes check authentication in `_authenticated/route.tsx`
5. RLS policies enforce database-level security

### Server Functions

Server functions in `lib/admin.functions.ts` use TanStack Start's `createServerFn`:

- Run on the server (have access to secrets)
- Validate inputs with Zod
- Use `requireSupabaseAuth` middleware
- Return type-safe results

### Vapi Integration

The webhook handler at `routes/api/public/vapi-webhook.ts`:

- Validates incoming webhooks with secret
- Normalizes Vapi event data
- Upserts call records (prevents duplicates)
- Handles out-of-order events safely

### Realtime Updates

The `useCallsRealtime` hook:

- Subscribes to Supabase Realtime
- Invalidates queries when calls table changes
- Keeps dashboard automatically updated

### Role-Based Access

Two roles are defined:

**Admin**:

- View and manage all calls
- Invite/manage users
- Access settings
- Sync Vapi calls manually

**Viewer**:

- View calls and dashboard
- No user management
- No settings access
- No manual sync

Roles are enforced at:

1. UI level (hide restricted features)
2. Server function level (reject unauthorized requests)
3. Database level (RLS policies)

## Component Guidelines

### State Management

- **Server state**: Use TanStack Query (`useQuery`, `useMutation`)
- **Form state**: Use React Hook Form
- **Auth state**: Use `useAuth()` hook
- **URL state**: Use TanStack Router search params

### Styling

- Use Tailwind utility classes
- Follow the design system in `styles.css`
- Use semantic color variables (e.g., `bg-primary`, `text-muted-foreground`)
- Responsive: mobile-first approach

### UI Components

All UI components are from shadcn/ui in `src/components/ui/`:

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
```

Add new components:

```bash
npx shadcn@latest add [component-name]
```

### Forms

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register("email")} />
    </form>
  );
}
```

### Server Functions

```tsx
import { createServerFn } from "@tanstack/react-start";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";

// Define server function
export const myAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    // Server-side code with access to secrets
    return { success: true };
  });

// Use in component
function MyComponent() {
  const action = useServerFn(myAction);
  const mutation = useMutation({
    mutationFn: (data) => action({ data }),
  });
}
```

## API Reference

### Supabase Tables

- `profiles`: User profiles (name, email, active status)
- `user_roles`: User role assignments (admin/viewer)
- `calls`: Call records from Vapi
- `app_settings`: Application settings (key-value store)
- `webhook_events`: Webhook event log (deduplication)

### Supabase Functions

- `has_role(user_id, role)`: Check if user has a role
- `is_active_user(user_id)`: Check if user is active
- `call_stats(timezone)`: Get dashboard statistics

### Key Hooks

- `useAuth()`: Get current user session, profile, role
- `useCallsRealtime()`: Subscribe to call updates
- `useMobile()`: Detect mobile viewport

### Utility Functions

- `formatDuration(seconds)`: Format seconds as "1h 23m 45s"
- `formatCost(amount)`: Format USD as "$1.23"
- `formatDateTime(iso)`: Format ISO date as "Jan 1, 2024 · 12:00 PM"
- `formatCallType(type)`: Format call type as "Inbound"

## Testing

### Unit Tests

```bash
npm run test
```

Tests use Vitest + Testing Library.

Example test:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

test("renders button", () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText("Click me")).toBeInTheDocument();
});
```

### Manual Testing

1. **Test authentication**:
   - Sign in/out
   - Create first admin
   - Access control (admin vs viewer)

2. **Test calls page**:
   - Search and filter
   - Pagination
   - Call details view
   - Audio playback

3. **Test admin features**:
   - Create/deactivate users
   - Change user roles
   - Sync Vapi calls
   - Test connection

4. **Test webhook** (requires Vapi account):
   - Trigger a call
   - Verify it appears in dashboard
   - Check transcript and recording

## Common Issues

### Port Already in Use

```bash
# Find and kill the process
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Supabase Connection Issues

- Verify your project URL and key
- Check if project is paused (free tier)
- Ensure RLS policies allow your user

### TypeScript Errors

```bash
# Regenerate route types
npm run dev  # or npm run build
```

### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lock
bun install

# Or with npm
rm -rf node_modules package-lock.json
npm install
```

## Best Practices

### Security

- Never log sensitive data (passwords, API keys)
- Always validate inputs with Zod
- Use server functions for sensitive operations
- Test RLS policies thoroughly

### Performance

- Use `keepPreviousData` for paginated queries
- Lazy load heavy components
- Optimize images in public/
- Use React.memo for expensive renders

### Code Style

- Use TypeScript strictly (no `any` unless necessary)
- Comment complex business logic
- Keep components small and focused
- Extract reusable logic into hooks

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Run linter: `npm run lint`
4. Commit with clear message: `git commit -m "feat: add new feature"`
5. Push and create pull request

## Resources

- [TanStack Router Docs](https://tanstack.com/router)
- [TanStack Query Docs](https://tanstack.com/query)
- [Supabase Docs](https://supabase.com/docs)
- [Vapi Docs](https://docs.vapi.ai)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
