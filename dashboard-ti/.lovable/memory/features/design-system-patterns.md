Global design system patterns: focus rings, hover transitions, loading buttons, error states

## Focus Ring (Global CSS)
- All inputs get subtle primary ring on focus: `box-shadow: 0 0 0 3px hsl(var(--primary) / 0.08)`
- Border shifts to `hsl(var(--primary) / 0.3)` with 0.2s ease transition

## Hover (Global)
- Primary buttons: `hover:bg-primary/90` with `transition-all duration-200`

## Loading Button
- `Button` component accepts `loading` prop
- When loading: shows `Loader2` spinner, disables button, hides children
- Import from `@/components/ui/button`

## Error State (Global CSS)
- Inputs with `aria-invalid="true"` get destructive border + subtle red ring
- Helper text: `<p className="mt-1 text-xs text-destructive">message</p>`
