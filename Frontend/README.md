# IFRS Frontend

## Setup

1) Add a `.env` file in the `Frontend/` directory with the following content:
    ```env
    VITE_API_BASE_URL=http://localhost:5217/api
    ```
2) Open a terminal in the repository root.
3) Move into the frontend folder:
    ```bash
	cd Frontend
    ```
4) Install dependencies:
    ```bash
	npm install
    ```
5) Start the dev server:
    ```bash
	npm run dev
    ```

**IMPORTANT**:
- Always run frontend commands inside the Frontend directory so `node_modules`, and `package.json` stay in this folder.
- Use a Node.js version that supports Vite 8.0.12.

## Project Structure

```txt
src/
├── api/                 # HTTP clients and API wrappers
├── assets/              # Static images and files
├── components/          # Reusable UI and feature components
│   ├── auth/            # Sign-in and admin setup UI
│   ├── navigation/      # Sidebar and navigation UI
│   └── ui/              # Shared UI primitives (button, tabs, toast, ...)
├── contexts/            # Cross-cutting state (auth, theme)
├── data/                # Local mock data or static lists
├── hooks/               # Reusable logic hooks
├── layouts/             # Page shells and shared layouts
├── lib/                 # Utilities and domain helpers
├── pages/               # Route-level screens
└── types/               # Shared TypeScript types
```

## Best Practices
### General
- Keep route pages thin: compose from components (UI) and hooks (Logic).
- Favor small, focused components with single responsibilities.
- When importing, instead of using relative or absolute paths, use the `@` alias to import from `src/`. E.g. Use
    ```tsx
    import { getUsers } from "@/api/users.api
    ```
    instead of 
    ```tsx
    import { getUsers } from "../../api/users.api
    ```
- Keep API calls out of components; use `api/` and `hooks/` instead.
- For the dummy data, use `data/` and import from there. Avoid hardcoding data in components.
- Toasts notifications are available via the `useToast` hook. Use them for important user feedback (success, error, info, warning) but avoid overusing them for minor actions. Example usage, 

    ```tsx
    import { useToast } from "@/hooks/useToast"
    
    const { addToast } = useToast()
    
    addToast({
        title: "Branch created",
        // description is optional.
        description: "The new branch has been successfully created.",
        type: "success", // Default is "info"
        // duration, position, fields are optional and have defaults
    })
    ```

### Components
- UI primitives go in `components/ui/`. Feature-specific UI goes in `components/<feature>/`.
- Keep props typed and explicit. Prefer named props over large "options" bags. Example: `<Button variant="primary" disabled={isLoading}>` is clearer than `<Button options={{ variant: "primary", disabled: isLoading }}>`.
- If a component is reused in 2+ places, promote it into `components/` or `components/ui/`.
- *shadcn/ui* components are available for use but not required. Use them when they fit the design **strongly** and keep custom styling minimal. You may need to install components if needed.
- Currently, reusable Button and HorizontalTabs components exist in `components/ui/`. Use these for consistency before creating new variants.

## Styling Guide
- Use the existing Tailwind utility classes and spacing scale.
- Reuse existing patterns (cards, overlays, toasts) before adding new ones.
- Keep class names readable; break long class lists across lines when needed. You may use `cn` in `lib/utils.ts` to conditionally apply classes.
- Do not hardcode colors unless it is mandatory for a specific design.
- All theming (colors, spacing, typography) are defined in `index.css` and should be used via Tailwind classes.

## Logic Guide
- Use the auth context for session state, not local component state.
- Do not access `localStorage` directly outside the auth provider or API layer.
- To access the current user or auth state, use the `useAuth` hook. E.g. `const { user, isAuthenticated } = useAuth()`.

## API Calling Guide
- Use `apiRequest` function in `api/client.ts` for HTTP calls.
- Add endpoints in `api/<feature>.api.ts` and return typed data. This calls the `apiRequest` and sends the response directly. No need to handle tokens, errors, or logic here.
- Call the API functions from hooks in `hooks/` to orchestrate data fetching and UI state. This is where you can handle loading states, errors, and side effects.
- Then, call the hooks from your components to get data and render UI. This keeps components focused on presentation and interaction, while hooks handle logic and API calls.
- Example, suppose you implement branch management. Then you would:
  - Add `getBranches` and `createBranch` in `api/branches.api.ts`.
  - Create a `useBranches` hook in `hooks/useBranches.ts` that calls these API functions and manages loading/error state.
  - Use the `useBranches` hook in your branch management page component to display the list of branches and handle user interactions.

## Types Guide
- Put shared types in `types/` and import from there. Non-shared types (e.g. props or API response types) can be defined in the same file as the component or API function that uses them.
- Keep API response types next to their endpoints in `api/` when they are not shared.
- Avoid any; prefer explicit union types when possible.

## Reusable Components
Start with existing components before creating new ones:
- `components/ui/` (button, horizontal-tabs, toast, etc.)
- `components/navigation/` (app-sidebar)
- `components/auth/` (signin-form, admin-signup-form)

## Implementation Guide
### Add a new feature screen
1) Create a new page in `pages/` and add a route in `App.tsx`.
2) If separate components are needed, build feature UI in `components/<feature>/`. If it is a reusable component, add it to `components/ui/`.
3) Add data fetching in `api/<feature>.api.ts`.
4) Create a hook in `hooks/` to orchestrate API calls and UI state.
5) Add shared types in `types/`.
6) Add utils in `lib/` if needed.

## Where to Take Ideas
- Match existing UI patterns in `pages/` and `components/` for spacing, typography, and layout.
- Reuse similar flows to keep the app consistent.
- If a pattern exists elsewhere, align with it before introducing a new variant.

## Contribution Guidelines
- Create a new branch for your feature or bug fix.
- Follow the best practices outlined above.
- Add descriptive commit messages and keep changes focused.
- Create a pull request with a clear description of the changes.

---
Last updated: 2024-05-19
