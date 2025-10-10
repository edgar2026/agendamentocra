# AI Development Rules for InsightFlow

This document outlines the technical stack and provides strict guidelines for the AI assistant to follow when developing and modifying this application. The goal is to ensure consistency, maintainability, and adherence to best practices.

## Tech Stack

This project is built with a modern, type-safe, and efficient technology stack:

-   **Framework**: React 18 with TypeScript for building a type-safe user interface.
-   **Build Tool**: Vite for fast development and optimized builds.
-   **Styling**: Tailwind CSS for utility-first styling. All styling should be done via Tailwind classes.
-   **UI Components**: A custom component library built with shadcn/ui, which uses Radix UI primitives for accessibility.
-   **Routing**: React Router (`react-router-dom`) for all client-side routing.
-   **Data Fetching & Caching**: TanStack Query (`@tanstack/react-query`) for managing server state.
-   **Charting**: Recharts for creating responsive and interactive data visualizations.
-   **Icons**: Lucide React for a comprehensive and consistent set of icons.
-   **Forms**: React Hook Form for performant form state management, paired with Zod for schema-based validation.
-   **Notifications**: A custom toast system (`useToast`) for simple feedback and Sonner for advanced notifications.

## Library Usage and Coding Conventions

### 1. Component Development
-   **ALWAYS** use components from `src/components/ui` when available (e.g., `Button`, `Card`, `Input`, `Select`).
-   **NEVER** create custom components for UI elements that already exist in `shadcn/ui`.
-   Create new, reusable components in `src/components` for application-specific logic.
-   Keep components small and focused on a single responsibility.

### 2. Styling
-   **ONLY** use Tailwind CSS utility classes for styling. Do not write custom CSS in `.css` files.
-   Use the `cn` utility function from `src/lib/utils.ts` to conditionally apply or merge Tailwind classes.
-   Adhere to the design system defined in `tailwind.config.ts` and `src/index.css` (e.g., `bg-primary`, `text-foreground`).

### 3. Routing and Pages
-   All application pages **MUST** be located in the `src/pages` directory.
-   Define all routes within `src/App.tsx` using the `<BrowserRouter>` and `<Routes>` components from `react-router-dom`.
-   The `Index.tsx` file is the main page of the application.

### 4. State Management
-   For server state (API data), **ALWAYS** use `@tanstack/react-query`.
-   For local, component-level UI state, use React's built-in hooks like `useState` and `useReducer`.

### 5. Icons
-   **EXCLUSIVELY** use icons from the `lucide-react` package. Import them directly, e.g., `import { Home } from "lucide-react";`.

### 6. Forms
-   **ALWAYS** use `react-hook-form` for managing form state and submissions.
-   Define form validation schemas using `zod`.
-   Use the `@hookform/resolvers` package to connect Zod schemas with React Hook Form.

### 7. Data Visualization
-   **ALL** charts and graphs must be built using the `recharts` library.
-   Ensure charts are responsive by wrapping them in the `ResponsiveContainer` component.

### 8. File Structure
-   **Pages**: `src/pages/`
-   **Reusable Components**: `src/components/`
-   **shadcn/ui Components**: `src/components/ui/`
-   **Custom Hooks**: `src/hooks/`
-   **Utility Functions**: `src/lib/` and `src/utils/`
-   **Type Definitions**: `src/types/`

By following these rules, the codebase will remain clean, consistent, and easy to manage.