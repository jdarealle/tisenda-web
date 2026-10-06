Tisenda is a client-rendered SPA built with Vite, React, TanStack Router, and TanStack Query.

# Getting Started

To run this application:

```bash
bun install
bun run dev
```

# Building For Production

To build this application for production:

```bash
bun run build
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Replace Tailwind utility classes in your components with your own styles
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:


```bash
bun run lint
bun run format
bun run check
```


## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
bunx shadcn@latest add button
```



## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

The Router plugin generates `src/routeTree.gen.ts` during development and builds. Do not edit this generated file manually. You can also generate it with `bun run generate-routes`.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

The layout is located in `src/routes/__root.tsx`. Shared UI belongs in the root route component, and the active child route renders through `<Outlet />`.

`index.html` defines the HTML document. `src/main.tsx` imports the global stylesheet and mounts React using `createRoot` and `RouterProvider`.

Here is an example layout that includes a header:

```tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
    </>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Data Fetching

### RAG query integration

The query client in `src/lib/rag-api.ts` mirrors the wire contract in
`tisenda-api/src/answer.rs` and `tisenda-api/src/server.rs`. It sends
`POST /api/query` with `{ "question": "..." }` and validates the returned
`text` and `sources`. Omitting `top_k` preserves the backend's configured default.
Queries are independent; the backend does not accept conversation history or
stream its response. A successful answer can have no sources.

`src/hooks/use-rag-chat.ts` provides in-memory turns, one active query, manual
retry, cancellation, and clearing. Cancelling stops the browser's wait; it does
not guarantee cancellation of backend generation. Its health hook uses
`GET /api/health`, which indicates HTTP availability only, not RAG readiness.

The home page presents the chat using the official shadcn Base UI / Nova
`Message`, `Bubble`, and `MessageScroller` components with the Zinc palette.
Enter sends a question; Shift+Enter inserts a line break. Only one query runs at
a time. Errors support manual retry, and "Nueva consulta" cancels the current
wait and clears the in-memory history. Reloading also clears the history.

The header's sun/moon button switches between light and dark mode using the
shadcn Button and the official Vite theme-provider pattern. Initially the app
follows the system theme, including live changes; an explicit selection is
stored separately as `tisenda-theme` in localStorage. If storage is blocked,
switching still works for the current session. Chat history is never persisted.

Answers render Markdown without executing HTML or loading embedded images.
The expandable sources preserve backend order so that citation `[n]` refers to
source `n`. They display filenames, relative paths, headings, captions and PDF
page numbers when present. Source paths are not download links; `/query` does
not provide a document-download endpoint. No ingestion UI or client is included.

Development runs on `http://localhost:5173` with a strict port. Vite proxies only
`/api/query` and `/api/health`, stripping `/api`, to `http://127.0.0.1:3000`.
Start the backend separately according to its README, then run:

```bash
bun install
bun run dev
```

To change the backend target, provide a process environment variable:

```bash
API_PROXY_TARGET=http://127.0.0.1:4000 bun run dev
```

`API_PROXY_TARGET` configures Vite's proxy and is not bundled into the browser.
In production, configure the host's reverse proxy to forward those same two
paths to the backend, stripping `/api`, before applying the SPA fallback.
Other `/api/*` paths should return 404. Static hosting alone does not supply an
API proxy. Keep model credentials exclusively in the backend.

The router context provides a `QueryClient`, and the router's `Wrap` component exposes that same instance to React through `QueryClientProvider`. Data fetching runs in the browser against an external API.

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).



# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

## Validation and Deployment

```bash
bun run generate-routes
bun run tsc --noEmit
bun run check
bun run build
bun run preview
```

Publish the generated `dist/` directory to a static host. Configure the host to serve `index.html` for frontend routes so direct links and page refreshes work. API requests should continue to go to your backend.
