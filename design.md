# Coachiatry — Design System

A single source of truth for visual language, tokens, and component conventions across the Coachiatry web product and any sibling sites (marketing, share pages, partner portals, etc.). Anything new should match what is documented here; if it must deviate, document the new token here first.

---

## 1. Brand

- **Product name:** Coachiatry
- **Logo:** `/public/assets/svg/logo.svg`, rendered at **155 × 32**. Always full-color on light backgrounds.
- **Tone:** Calm, professional, slightly clinical. The product helps coaches manage clients, tasks, transcripts, chats, and documents — visuals should feel organized and trustworthy, not playful.

---

## 2. Tech Stack & Conventions

| Concern | Choice |
| --- | --- |
| Framework | Next.js (Pages router) + React 19 |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"`) + `tw-animate-css` |
| Component primitives | shadcn/ui — `style: "new-york"`, `baseColor: "zinc"`, `cssVariables: true` |
| Headless primitives | Radix UI (`@radix-ui/react-*`) |
| Icon library | `lucide-react` (primary), `@iconify/react` and `react-icons` for niche glyphs |
| Forms | `react-hook-form` + `yup` (`@hookform/resolvers`) |
| Data | `@tanstack/react-query` |
| Toasts | `sonner` — `<Toaster richColors position="bottom-left" />` |
| Animations | `motion` (Framer Motion) for orchestrated UI, CSS keyframes for spinners |
| Aliases | `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks` |
| Theme mode | **Light only** — `:root { color-scheme: light; }`. Dark mode tokens exist but are commented out. Do not enable dark mode without coordinating across all surfaces. |

`cn()` from `@/lib/utils` is the canonical class-merger (clsx + tailwind-merge). Always use it when conditionally composing classes.

---

## 3. Color Tokens

All colors are declared as CSS variables in [styles/globals.css](styles/globals.css) and surfaced as Tailwind utilities via `@theme inline`. **Never hard-code hex values in components for brand colors — use the token.**

### 3.1 Brand & semantic tokens

| Token | Value | Tailwind class | Usage |
| --- | --- | --- | --- |
| `--background` | `#f9f9f9` | `bg-background` | App canvas |
| `--foreground` | `oklch(0.141 0.005 285.823)` | `text-foreground` | Primary text on `background` |
| `--primary` | `#0e1734` | `bg-primary`, `text-primary` | Deep navy. Brand. Used for primary buttons, active states, key accents. |
| `--primary-foreground` | `#ffffff` | `text-primary-foreground` | Text on primary |
| `--primary-text` | `#0a090b` | `text-primary-text` | Highest-emphasis headings on light surfaces |
| `--secondary` | `#ececed` | `bg-secondary` | Light neutral chip / button background |
| `--secondary-foreground` | `#4f4d55` | `text-secondary-foreground` | Text on secondary |
| `--muted` | `oklch(0.967 0.001 286.375)` | `bg-muted` | Subdued surfaces (tabs background, etc.) |
| `--muted-foreground` | `oklch(0.552 0.016 285.938)` | `text-muted-foreground` | Helper text, descriptions |
| `--accent` | `oklch(0.967 0.001 286.375)` | `bg-accent` | Hover / focus tint |
| `--accent-foreground` | `oklch(0.21 0.006 285.885)` | `text-accent-foreground` | Text on accent |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `bg-destructive`, `text-destructive` | Errors, destructive actions |
| `--border` | `oklch(0.92 0.004 286.32)` | `border-border` | Default border |
| `--input` | `oklch(0.92 0.004 286.32)` | `border-input` | Form field border |
| `--ring` | `oklch(0.705 0.015 286.067)` | `ring-ring` | Focus ring |
| `--card` | `#ffffff` (oklch 1 0 0) | `bg-card` | Card / surface backgrounds |
| `--card-foreground` | dark neutral | `text-card-foreground` | Text on card |
| `--popover` / `--popover-foreground` | white / dark neutral | `bg-popover`, `text-popover-foreground` | Popover, dropdown content |
| `--sidebar*` | matching neutral set | `bg-sidebar`, etc. | Reserved for future sidebar surface theming |
| `--chart-1` … `--chart-5` | warm/cool oklch ramp | `text-chart-1` etc. | Recharts series colors |

### 3.2 Brand gradient

Use **only** for hero / promotional CTAs. Reach for `.gradient-button`:

```css
background-image: linear-gradient(129deg, #0e1734 10%, #314587 50%, #0e1734);
```

### 3.3 Neutral palette (Tailwind `gray-*`)

The codebase leans on Tailwind's `gray` scale for non-token neutrals. Common pairings:

| Usage | Class |
| --- | --- |
| Body / secondary text | `text-gray-500`, `text-gray-700` |
| Strong text | `text-gray-900` |
| Disabled / placeholder | `text-gray-300` |
| Hover surface | `bg-gray-100`, `bg-gray-200/60` |
| Divider lines | `border-gray-200`, `border-gray-300` |
| Scrollbar thumb | `#e2e4e6` default, `#cccfd5` hover |

`@layer base` sets the default border color to `var(--color-gray-200, currentcolor)` — every element inherits a light gray border by default.

### 3.4 Status & accent ramps

These are used contextually (badges, status pills, toasts). Stick to the same shades:

| Intent | Background | Foreground |
| --- | --- | --- |
| Info / link | `bg-blue-50` / `bg-blue-100` | `text-blue-500`, `text-blue-600` |
| Success | `bg-green-50` | `text-green-600` |
| Warning | `bg-yellow-200` | `text-yellow-500` (on dark) |
| Error | `bg-red-50` | `text-red-500`, `text-red-600` |
| Avatar fallback | `bg-orange-100` | `text-orange-600` |

Task/document **status colors are data-driven** — they arrive from the API on each `Status`/`Tag` (e.g. `_status.color.bg`, `_status.color.text`) and are applied via inline `style`. Do not hardcode status colors in components.

---

## 4. Typography

### 4.1 Font families

Two Google fonts, registered in [services/fonts.ts](services/fonts.ts) and applied in [pages/_app.tsx](pages/_app.tsx) via CSS variables.

| Font | Variable / Tailwind class | Where it's used |
| --- | --- | --- |
| **Archivo** (variable: `--font-archivo`) | `font-archivo` | All headings (`h1`–`h6`), buttons, badges, navigation labels |
| **Lato** (weights 100/300/400/700/900, var `--font-lato`) | `font-lato` (default on `body`) | Body copy, paragraphs, inputs, table content |

Global rule in [styles/globals.css](styles/globals.css):

```css
body { @apply bg-background text-foreground font-lato; }
h1, h2, h3, h4, h5, h6 { font-family: var(--font-archivo); }
```

### 4.2 Type scale (observed conventions)

Tailwind size — preferred line height / weight / use case:

| Class | Line-height | Weight | Typical use |
| --- | --- | --- | --- |
| `text-[32px]` | `leading-10` | `font-semibold` | Auth card title (`Login to account`) |
| `text-2xl` (24px) | `leading-7` | `font-semibold` | Page headings (e.g. dashboard "Hey, …") |
| `text-xl` (20px) | – | `font-semibold` | Section headers |
| `text-lg` (18px) | `leading-none` | `font-semibold` | Dialog titles |
| `text-base` (16px) | – | `font-regular` | Input field text |
| `text-sm` (14px) | `leading-5` | `font-medium`/`font-semibold` | **Default body / UI text** — most used |
| `text-xs` (12px) | `leading-4`/`leading-4.5` | `font-medium` | Meta info, timestamps, badges, table chips |
| `text-[10px]` | `leading-3` | uppercase + `tracking-[5%]` | Sidebar section labels |

Letter-spacing patterns: hero/heading titles use `tracking-[-3%]`; nav labels use `tracking-[0.05px]`; section eyebrows use `tracking-[5%]`.

`text-sm` is the **default UI text size**. Reach for it unless you have a reason to go larger or smaller.

---

## 5. Spacing, Radius, Sizing

### 5.1 Radius scale

Driven by `--radius: 0.625rem` (10px):

| Token | Tailwind class | Resolved |
| --- | --- | --- |
| `--radius-sm` | `rounded-sm` | 6px |
| `--radius-md` | `rounded-md` | 8px |
| `--radius-lg` | `rounded-lg` | 10px |
| `--radius-xl` | `rounded-xl` | 14px |
| `rounded-full` | pills, avatars, scrollbar thumb | — |

Conventions: cards use `rounded-xl`; buttons / inputs / popovers / sheets use `rounded-md`; chips, badges, status pills use `rounded-sm`; avatars use `rounded-full`.

The app-shell card has a distinctive `rounded-tl-xl` (top-left only) to "tuck under" the sidebar.

### 5.2 Spacing

Use Tailwind's default spacing scale. Common patterns seen across pages:

- Page outer padding (auth / nav): `px-12 py-5` desktop, `max-sm:px-4 max-sm:py-4` mobile
- Main content card padding: `p-7 max-sm:p-4`
- Sidebar container: `p-4 space-y-4`
- Card content padding: `px-6 py-6` (shadcn default in `Card`)
- Form spacing: `space-y-5` between fields blocks, `space-y-4` within
- Nav item padding: `px-2 py-2.5`, gap-2

### 5.3 Breakpoints

Defined in `@theme` in [styles/globals.css](styles/globals.css) — note `--breakpoint-*: initial;` resets defaults before redefining:

| Token | Value |
| --- | --- |
| `xs` | 480px |
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px (sidebar/desktop split happens here) |
| `xl` | 1280px |
| `2xl` | 1536px |
| `3xl` | 1792px |

Mobile-first by default; `max-lg:`, `max-sm:` prefixes are heavily used for desktop-down overrides.

### 5.4 Shadows

- Cards: `shadow-sm` (default in `Card`)
- Inputs, triggers, buttons: `shadow-xs`
- Popover / select / dropdown content: `shadow-md`
- Dialog content: `shadow-lg`

---

## 6. Layout & Page Shells

### 6.1 Authenticated app shell — [layouts/AppLayout.tsx](layouts/AppLayout.tsx)

```
┌─────────────────────────────────────────────┐
│ Sidebar (312px) │  Navbar (px-12 py-5)      │
│                 ├───────────────────────────┤
│  • main nav     │                           │
│  • others       │   Card (rounded-tl-xl,    │
│  • watching     │     p-7, overflow-y-auto) │
│                 │     ↓ page content        │
└─────────────────────────────────────────────┘
```

Key classes:
- Root: `h-screen bg-background flex overflow-hidden`
- Sidebar fixed-width `w-[312px]`, becomes overlay below `lg` (`max-lg:fixed max-lg:z-[1000]`, slides in from `-left-100`).
- Right column wraps `Navbar` + `Card`; the `Card` is the scroll container (`overflow-y-auto`), with content padded `p-7`.
- The content card uses **`rounded-tl-xl` only** with `border-r-0 border-b-0` so it visually merges with the viewport edges.
- `SessionGuard` wraps the layout — never render the app shell without it.

### 6.2 Auth shell — [layouts/AuthLayout.tsx](layouts/AuthLayout.tsx)

- Top bar `AuthNavbar`: logo on left, contextual CTA on right (Sign In ⇄ Sign Up), `border-b border-gray-300`.
- Body uses the `.bg-auth` utility (background image `/assets/svg/background-login.svg`, `cover`, centered) with content centered via `flex items-center justify-center`.
- Inside: a `Card` with `w-full max-w-lg max-sm:max-w-[95%] py-9`, centered text header, then a form.

### 6.3 Sidebar pattern — [layouts/Sidebar.tsx](layouts/Sidebar.tsx)

- Sections defined in [config/sidelinks.ts](config/sidelinks.ts).
- Section eyebrow: `py-1.5 px-3 uppercase text-[10px] leading-3 tracking-[5%]`.
- Nav item: `px-2 py-2.5 flex items-center gap-2 text-gray-500 rounded-md hover:bg-gray-200/60 transition-all`.
- Active state: `bg-primary hover:bg-primary`, label `text-white`, icon `invert brightness-0`.
- Sections separated by `<Separator className="text-gray-200" />`.

### 6.4 Navbar — [layouts/Navbar.tsx](layouts/Navbar.tsx)

`px-12 py-5 flex items-center justify-end gap-6`. Below `lg`, hamburger + Logo appear on the left. Contains `GlobalSearch`, optional `CoachAI` popover, and a user avatar+name+email cluster that opens a logout popover.

### 6.5 Dashboard grid

```
grid-cols-2 grid-rows-2 gap-5  max-md:grid-cols-1
```

Left column spans both rows (`row-span-2`), right column is two stacked cards. Each card: `p-4 border border-gray-200 rounded-md shadow-xs`, with a header (`text-sm font-semibold` title + `text-xs font-medium text-primary` "See All" link).

---

## 7. Components

All primitives live in [components/ui/](components/ui/) (shadcn). App-specific composites live in [components/](components/) (e.g. `Chats`, `Tasks`, `Clients`, `GlobalSearch`, `CoachAIPopover`, `FloatingChat`). Reuse before re-implementing.

### 7.1 Button — [components/ui/button.tsx](components/ui/button.tsx)

Variants: `default` (primary navy), `outline`, `secondary`, `ghost`. (Note: `destructive` and `link` exist in shadcn but are intentionally commented out — don't reintroduce without design review.)

Sizes: `default` (`px-3.5 py-2.5`, `max-sm:px-3 max-sm:py-1.5`), `sm`, `lg`, `icon`.

Base classes (truncated): `inline-flex items-center justify-center gap-2 rounded-md text-sm font-archivo font-medium`.

Extra props: `isLoading` (renders inline spinner), `spacebetween`, `center`.

Use `Button` for all clickable actions — including nav-style links via `asChild` + `<Link>`. Don't roll bare `<button>` elements.

### 7.2 Card — [components/ui/card.tsx](components/ui/card.tsx)

Default: `bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm`. Pair with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`.

### 7.3 Input — [components/ui/input.tsx](components/ui/input.tsx)

`h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs ... md:text-sm`. Focus: `focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-[1px]`. Aria-invalid styling: red border + ring.

`PasswordInput` extends `Input` with show/hide toggle.

### 7.4 Badge — [components/ui/badge.tsx](components/ui/badge.tsx)

Variants: `default` (primary), `secondary`, `destructive`, `outline`, `counter` (small numeric pill, `rounded-sm py-0.5`). Base: `rounded-md border px-1.5 py-1 text-xs font-medium`.

### 7.5 Dialog & Sheet

- **Dialog** ([components/ui/dialog.tsx](components/ui/dialog.tsx)): centered modal, `max-w-lg`, `rounded-lg p-6 shadow-lg`. Overlay `bg-black/50`. Close `X` top-right.
- **Sheet** ([components/ui/sheet.tsx](components/ui/sheet.tsx)): edge-anchored drawer (right/left/top/bottom). Right/left default `w-3/4 sm:max-w-sm`. Used for detail panes.

### 7.6 Tabs — [components/ui/tabs.tsx](components/ui/tabs.tsx)

Pill-in-track style: `TabsList` is `bg-muted h-9 rounded-lg p-[3px]`; active trigger goes `bg-white text-gray-900 font-semibold shadow-sm`.

### 7.7 Avatar / SmartAvatar — [components/ui/smart-avatar.tsx](components/ui/smart-avatar.tsx)

Default avatar is `size-8` (32px) `rounded-full`. **Always prefer `SmartAvatar`** over raw `Avatar` — it provides shimmer-while-loading, motion fade-in, error fallback, and initials. Fallback styling: `bg-orange-100 text-orange-600 font-semibold`.

### 7.8 Table — [components/ui/table.tsx](components/ui/table.tsx)

`text-sm`, header `h-10 px-2 font-medium`, rows `border-b transition-colors hover:bg-muted/50`. Wrapping container is `relative w-full overflow-visible max-sm:overflow-auto scrollbar-hide`.

### 7.9 Form — [components/ui/form.tsx](components/ui/form.tsx)

Standard shadcn `Form` (react-hook-form integration). Field structure:

```tsx
<FormField control={form.control} name="email" render={({ field }) => (
  <FormItem>
    <FormLabel>Email</FormLabel>
    <FormControl><Input ... /></FormControl>
    <FormMessage />
  </FormItem>
)}/>
```

Validation: `yup` + `yupResolver`. Errors surface through `FormMessage`; never render manual error text under inputs.

### 7.10 Other primitives present (use them)

`Alert`, `AlertDialog`, `AspectRatio`, `Calendar`, `Checkbox`, `Collapsible`, `Combobox` (+ creatable + API-search), `Command`, `CountryCodeSelect`, `DateTimePicker`, `DropdownMenu`, `HoverCard`, `InputOtp`, `Label`, `MultiSelect` (+ API-search), `Pagination`, `Popover`, `Progress`, `RadioGroup`, `ScrollArea`, `Select`, `Separator`, `Skeleton`, `Switch`, `Textarea`, `Tooltip`.

App-level composites worth knowing about:
- `GlobalSearch` (navbar)
- `CoachAIPopover` (AI entry point)
- `FloatingChat` + `FloatingChatProvider` (persistent chat overlay, mounted in `_app.tsx`)
- `SessionGuard` (auth gate)
- `SmartAvatar` (use everywhere over `Avatar`)
- `DeleteDialog`, `DocumentSheet`, `Loader`, `MultiSelectUsers`, `AsyncMultiSelectUsers`

---

## 8. Iconography

- **Primary library:** [`lucide-react`](https://lucide.dev) — use for in-product icons. Default `size-4` (16px) inside buttons; nav menus use 20px (`width={20} height={20}`).
- **Custom SVGs:** Centralized in [json/assets/index.ts](json/assets/index.ts) under `assets.icons.*` and rendered via `next/image`. Add new icons here rather than scattering paths.
- Iconify and `react-icons` are installed for one-off needs but should not become the default.

Active-state pattern for navigation: icons are monochrome SVGs colored via `invert brightness-0` when on a dark primary background.

---

## 9. Motion & Feedback

- **Framer Motion / `motion`** for orchestrated animations (e.g. avatar fade-in in `SmartAvatar`).
- **CSS keyframes** registered as Tailwind animations in [styles/globals.css](styles/globals.css):
  - `animate-spin-slow` — 1s linear infinite, used for ambient spinners
  - `animate-dash` — 1.4s stroke-dash animation for SVG loaders
- **Skeletons:** roll-your-own pattern using `bg-gray-200/70 animate-pulse rounded-md` blocks that match the final layout's box sizes (see dashboard skeletons in [pages/index.tsx](pages/index.tsx)). Prefer this over showing spinners for content placeholders.
- **Toasts:** `sonner` — `richColors`, `position="bottom-left"`. Success messages use `toast.success(...)`, error toasts use `toast.error(...)`. The global `MutationCache` auto-toasts success messages from `x-message` headers and error messages from API error payloads — don't double-toast in components.
- **Hover / focus:** buttons get `hover:bg-primary/90`; nav items get `hover:bg-gray-200/60`; rows get `hover:bg-muted/50`. Always `transition-all` or `transition-colors`.

---

## 10. Scrollbars

Custom thin scrollbars (WebKit only):

```css
::-webkit-scrollbar       { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background-color: #e2e4e6; border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background-color: #cccfd5; }
```

Use `.scrollbar-hide` to opt out entirely (used inside tables and horizontal carousels).

---

## 11. Editor & Rich Content

The product embeds rich-text via Tiptap and Milkdown. Shared CSS conventions in [styles/globals.css](styles/globals.css):

- `.tiptap ul` → `list-disc pl-5.5`
- `.tiptap ol` → `list-decimal pl-6`
- Empty-editor placeholder: `color: #adb5bd`, `font-style: italic`
- `.ProseMirror-focused` removes the default outline (`!outline-0`)
- `.prose` is overridden to `flex-1 inline-flex` for the layout this app needs (do not assume Tailwind Typography defaults)

When introducing new rich-text surfaces, reuse these classes so editor chrome stays visually consistent.

---

## 12. Accessibility & States

- Focus visibility is mandatory. Tokens drive it: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]` on interactive surfaces (buttons, badges); `ring-[1px]` for inputs.
- Disabled state: `disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed`.
- Aria-invalid: `aria-invalid:ring-destructive/20 aria-invalid:border-destructive`.
- Always pair icon-only controls with `sr-only` labels (see `DialogClose` example).
- Forms must be labelled with `<FormLabel>` / `<Label>` — no placeholder-as-label.

---

## 13. Reusable Utilities & Recipes

### 13.1 `cn()`

```ts
import { cn } from "@/lib/utils";
cn("base-class", condition && "extra-class", className)
```

Always use it when composing classnames conditionally.

### 13.2 Page title (SEO)

Wrap each page with `PageTitle`:

```tsx
import PageTitle from "@/components/Seo/PageTitle";
<PageTitle title="Dashboard" />
```

A brand-fallback `<PageTitle />` is rendered globally in `_app.tsx`.

### 13.3 Gradient CTA

```html
<button class="gradient-button text-white rounded-md px-4 py-2 ...">…</button>
```

### 13.4 Width clamp for week views

`.weekContainer { max-width: calc(100vw - 368px); }` — sized to the sidebar (312px) + gutters. Use it for any wide horizontal scroll area that must not push the layout.

### 13.5 Auth background

Use the `.bg-auth` class anywhere you need the marketing-style backdrop (it pulls from `/assets/svg/background-login.svg`).

---

## 14. Cross-site Consistency Checklist

When building a sibling site or new surface, replicate the following minimum to stay on-brand:

- [ ] Use the same `--background`, `--primary`, `--primary-text`, `--secondary` token values (Section 3.1).
- [ ] Load **Archivo** for headings/buttons, **Lato** for body. Both via `next/font/google` exposing CSS variables (Section 4.1).
- [ ] Adopt the same Tailwind v4 `@theme` setup, including the `--radius: 0.625rem` base and the breakpoint list (Sections 5.1 + 5.3).
- [ ] Ship the same color-scheme: light only — no system dark mode (Section 2).
- [ ] Build with shadcn/ui (`style: "new-york"`, `baseColor: "zinc"`), Radix, and `lucide-react`. Mirror the variant lists in `Button`, `Badge`, `Card` (Section 7).
- [ ] Use `sonner` toasts at `bottom-left` with `richColors`; reuse the `MutationCache` toast pattern from [pages/_app.tsx](pages/_app.tsx) if React Query is present.
- [ ] Render the Coachiatry logo at 155×32 in the header; use the auth shell pattern (logo + opposite CTA + `border-b border-gray-300`) for marketing-style top bars.
- [ ] Reuse `.gradient-button`, `.bg-auth`, custom scrollbar styles, and skeleton patterns rather than re-deriving them.
- [ ] Default body class: `bg-background text-foreground font-lato`. Default heading family: Archivo.
- [ ] When in doubt about a color, choose the closest semantic token in Section 3.1 before reaching for raw Tailwind hues.

---

## 15. Open conventions / unwritten rules

- **`text-sm` is default.** Most labels, body, table cells, and form text live here.
- **Icons before text** with `gap-2` is the standard inline pattern (buttons, nav, badges).
- **Use `font-archivo` for anything button-like, badge-like, or capitalized eyebrow.** Lato is reserved for paragraphs and data.
- **Don't introduce `destructive` Button variant** without design sign-off — the codebase intentionally commented it out and uses outline/ghost confirmations with copy that conveys destruction.
- **Don't hardcode status colors** — they're data-driven from the API per Status/Tag.
- **Don't add a dark theme** in isolation. The tokens exist but the contract is light-mode-only until coordinated.

---

If any of the above drifts from reality, update this file in the same PR as the visual change so sibling sites stay aligned.
