# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## 🎨 Color System — STRICT RULES (Do not deviate)

This project uses a fixed 5-color palette. No other colors are allowed.
Do NOT use arbitrary Tailwind values like bg-[#fff] or any color outside this system.

### Color Variables (CSS & Tailwind)

| Role            | Hex       | Tailwind Class           | CSS Variable          |
|-----------------|-----------|--------------------------|-----------------------|
| Darkest (bg)    | #212A31   | brand-darkest            | var(--color-darkest)  |
| Dark (surface)  | #2E3944   | brand-dark               | var(--color-dark)     |
| Primary (CTA)   | #124E66   | brand-primary            | var(--color-primary)  |
| Muted (subtle)  | #748D92   | brand-muted              | var(--color-muted)    |
| Light (base)    | #D3D9D4   | brand-light              | var(--color-light)    |

### Usage Guidelines

- Page/app background       → bg-brand-light or bg-brand-darkest (dark mode areas)
- Sidebar & navbar bg       → bg-brand-darkest
- Card/panel backgrounds    → bg-brand-dark
- Primary buttons & links   → bg-brand-primary, hover:bg-brand-primary/80
- Body text on dark bg      → text-brand-light
- Body text on light bg     → text-brand-darkest
- Subtext, labels, borders  → text-brand-muted or border-brand-muted
- Input backgrounds         → bg-brand-light border-brand-muted
- Active/selected state     → bg-brand-primary text-brand-light
- Disabled states           → text-brand-muted bg-brand-dark

### Prohibited

- ❌ No Tailwind default colors (blue-500, gray-200, slate-800, etc.)
- ❌ No hardcoded hex in className
- ❌ No white (#fff) or black (#000) — use brand-light and brand-darkest instead
- ❌ No external UI library default themes unless overridden with this palette