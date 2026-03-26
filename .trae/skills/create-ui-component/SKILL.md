---
name: Create UI Component
description: Правила создания новых компонентов интерфейса (Shadcn + Tailwind)
---

When the user asks to create or modify a UI component:

1. **Design System:**
   - Use `shadcn/ui` components as the base.
   - Use `lucide-react` for icons (default: `stroke-width={1.5}`, size `w-4 h-4`).
   - Borders: `border-slate-200` (light) / `border-slate-800` (dark).
   - Rounded: `rounded-xl` for containers, `rounded-md` for buttons/inputs.

2. **Localization:**
   - ALL visible text must be in **POLISH**.
   - Currency format: `1 234,00 zł` (space as thousand separator, comma as decimal).

3. **Layout & Scroll Safety:**
   - NEVER add scroll to the `body` or main wrapper.
   - If the component displays a list, wrap it in a `flex-1 overflow-hidden` container and put `overflow-y-auto` on the list itself.
   - Use `w-full h-full` to fill parent containers instead of fixed pixel sizes.

4. **Data:**
   - Always assume separate `Labor` (Robocizna) and `Material` costs.
   - If VAT is involved, check if it's 8% (Service) or 23% (Material).