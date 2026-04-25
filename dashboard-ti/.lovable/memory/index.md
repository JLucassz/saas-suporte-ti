# Memory: index.md
Updated: now

# Estúdio Trama – Design System

## Colors (HSL in index.css)
- Background: #F9F9F9 (off-white)
- Surface: #FFFFFF (cards, modals)
- Border: very subtle, almost invisible
- Foreground/Primary: #0F172A (slate-900, text + primary accent)
- Muted foreground: #6B7280 (secondary text)
- Kanban bg: hsl(0 0% 96%)
- Priority: high (red), medium (amber), low (green)
- Avatar user: blue pastel bg + blue fg
- Avatar tech: emerald pastel bg + emerald fg

## Shadows (approved override of no-shadow rule)
- Cards use --shadow-card: ultra-soft, 0.04 opacity
- No heavy box-shadows

## Fonts
- Body/UI: Inter (400, 500)
- Page titles (H1): Geist Mono Medium

## Anti-patterns (REJECTED)
- No solid/filled icons – outline only, strokeWidth 1.5
- No fade-in animations on page load
- No gradients for depth simulation

## Avatars
- Circular initials in Geist Mono (font-mono)
- User: pastel blue bg, blue text
- Technician: pastel emerald bg, emerald text (only in "Em Atendimento")
- Overlapping with -space-x-1.5 + ring-2 ring-surface

## Layout
- Sidebar: 240px fixed, border-right, white bg
- Header: 64px fixed, border-bottom
- Content gap: 48px between sections
- Active sidebar: vertical 2px bar on left edge, foreground color text

## Context: Help Desk SaaS
- Dashboard has Kanban columns: Abertos, Em Andamento, Aguardando, Resolvidos
- Ticket cards: white bg, soft shadow, priority dot + label, title, user name
