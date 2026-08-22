# Dayflow — Design System

Light theme, whites-forward. This overrides the dark theme shown in the original wireframe — same layout and components, different palette and mood.

## 1. Color Palette (source: DopelyColors)

| Hex | Name (working) | Role |
|---|---|---|
| `#F3EFDF` | Warm Cream | **Primary background** — page background, card fills |
| `#FFFFFF` | White | Elevated surfaces — cards on top of the cream background, modals, inputs |
| `#5E7892` | Slate Blue | **Primary brand color** — primary buttons, active nav item, links, headings on hover |
| `#A7B7C6` | Soft Blue-Grey | Secondary UI — borders, dividers, inactive nav icons, secondary buttons |
| `#BDCFAA` | Light Sage | Success/positive accent — "Present" status, Approved badges, positive states |
| `#8E9E83` | Deep Sage | Secondary accent — hover states on sage elements, "on leave" badges, tag chips |

**Gap to fill:** the palette has no warning/red tone. Add one utility color outside the palette for "Absent" status and destructive actions (Reject buttons, validation errors):
- `#C97B63` (muted terracotta) — reads as warm/urgent without clashing with the sage/blue palette. Use sparingly: absent status dot, reject button, error text/border only.

### Status color mapping (per wireframe's dot system)
- 🟢 Present → `#BDCFAA` (Light Sage), fully filled dot
- 🟡 On Leave → `#8E9E83` (Deep Sage), half-filled dot
- 🔴 Absent → `#C97B63` (terracotta), fully filled dot

### Neutral text colors
- Primary text: `#2E3B33` (dark, desaturated — sits comfortably on cream, not pure black)
- Secondary/muted text: `#6B7A72`
- Text on `#5E7892` primary buttons: `#FFFFFF`

## 2. Typography

- **Headings:** Space Grotesk — 600/700 weight
- **Body:** Inter — 400/500 weight
- Type scale (rem, base 16px):
  - `text-xs` 0.75 · `text-sm` 0.875 · `text-base` 1 · `text-lg` 1.125 · `text-xl` 1.25 · `text-2xl` 1.5 · `text-3xl` 1.875

## 3. Spacing & Layout

- Base unit: 4px. Use Tailwind's default scale (1=4px, 2=8px, 4=16px, 6=24px, 8=32px) — don't invent custom pixel values.
- Card padding: `p-6` (24px)
- Section gaps: `gap-6` to `gap-8`
- Max content width: `max-w-7xl`, centered, with `px-4` on mobile / `px-8` on desktop
- Border radius: `rounded-xl` (12px) on cards and buttons, `rounded-full` on avatars and status dots — matches the pill-shaped cards in the reference palette image

## 4. Navigation

- Persistent top nav bar, identical on every page: **Company Logo | Employees | Attendance | Time Off** (left-aligned) — **status dot + avatar** (right-aligned)
- Active nav item underlined or filled with `#5E7892` at 10% opacity background
- Nav bar background: White, `border-b` in `#A7B7C6` at low opacity — sits distinctly above the cream page background
- **Mobile:** collapse the four nav links into a bottom tab bar or hamburger menu — do not shrink the desktop nav in place, actually restructure it. "Responsive" is a graded must-have, treat it as a real requirement per breakpoint, not an afterthought.

## 5. Components

- **Buttons:** Primary = `#5E7892` bg / white text; Secondary = white bg, `#A7B7C6` border, `#2E3B33` text; Destructive = `#C97B63` bg / white text
- **Employee cards:** white surface on cream page background, subtle shadow (`shadow-sm`), photo + name + status dot top-right, `rounded-xl`
- **Status badges** (time-off status): Approved = sage bg/dark sage text, Pending = blue-grey bg/slate text, Rejected = terracotta bg/white text
- **Form inputs:** white bg, `#A7B7C6` border at rest, `#5E7892` border on focus, `#C97B63` border + helper text on validation error
- **Calendar (time-off picker):** keep it clean/minimal — sage dot for allocated days, slate outline for the selected range

## 6. Responsive Breakpoints (Tailwind defaults)

- `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px
- Employee card grid: 1 col mobile → 2 col `md` → 3 col `lg` (matches the wireframe's 3-column layout on desktop)
- Attendance/time-off tables: switch to a stacked card view below `md` — don't force horizontal scroll on a data table on mobile

## 7. Tone

Clean, calm, professional — not corporate-cold. The cream background + sage accents should feel warm and human for an HR tool people use daily, in contrast to the colder blue-and-white of most enterprise HR software (including Odoo's own).
