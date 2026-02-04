---
name: frontend-landing-design
description: Modern landing page design patterns using Tailwind CSS. Use when creating landing pages, marketing pages, or product showcase pages. Provides design patterns for hero sections, feature grids, testimonials, CTAs, and responsive layouts with dark mode support.
---

# Frontend Landing Design

## Overview

This skill provides design patterns and a template for building modern, responsive landing pages using Tailwind CSS with a professional SaaS aesthetic.

## Quick Start

Copy the template from `assets/landing-template.html` and customize sections as needed.

## Design System

### Colors

Primary brand color with light/dark mode support:

```javascript
colors: {
  "primary": "#137fec",
  "background-light": "#ffffff",
  "background-dark": "#101922",
  "slate-light": "#f8fafc",
  "slate-dark": "#1e293b"
}
```

### Typography

Use Inter font family for all text:
- Headings: `font-black` or `font-bold`
- Body: `font-medium` or default weight
- Small text: `text-sm` with `text-gray-600 dark:text-gray-300`

## Section Patterns

### 1. Sticky Header

```html
<header class="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-background-dark/95 backdrop-blur-sm">
```

Key patterns:
- Use `backdrop-blur-sm` with semi-transparent background
- Logo + nav links + CTA buttons layout
- Hide secondary nav on mobile: `hidden md:flex`

### 2. Hero Section

```html
<section class="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
```

Key patterns:
- Two-column grid: text left, visual right
- Animated badge with ping effect for announcements
- Large heading with gradient accent text
- Primary + secondary CTA buttons
- Trust badges with checkmarks

### 3. Feature Grid

```html
<div class="grid md:grid-cols-3 gap-8">
```

Key patterns:
- Icon boxes with hover scale: `group-hover:scale-110`
- Card containers: `bg-white dark:bg-gray-800 rounded-2xl shadow-sm border`
- Feature tags/badges for compliance labels

### 4. Process Steps

Horizontal connected steps with icons:
- Connecting line: `absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-200`
- Numbered headings: "1. Step Name"
- Icon containers: `w-24 h-24 rounded-2xl`

### 5. Testimonials

```html
<div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border">
```

Key patterns:
- Star ratings with Material Icons
- Italic quote text
- Avatar + name + title footer
- Use `flex-grow` on quote for equal height cards

### 6. CTA Banner

```html
<div class="bg-primary rounded-3xl p-8 sm:p-12 text-center text-white">
```

Key patterns:
- Dot pattern overlay for texture
- Contrasting button colors (white on primary)
- Centered layout with max-width

### 7. Footer

Multi-column layout with:
- Brand section (logo + description + social links)
- Link columns (Product, Support, Legal)
- Copyright + status indicator

## Responsive Patterns

- Use `sm:`, `md:`, `lg:` breakpoints
- Stack on mobile, grid on desktop: `flex flex-col sm:flex-row`
- Hide elements on mobile: `hidden sm:flex`
- Adjust padding: `px-4 sm:px-6 lg:px-8`

## Dark Mode

All components support dark mode via `dark:` prefix:
- Backgrounds: `bg-white dark:bg-gray-800`
- Text: `text-gray-600 dark:text-gray-300`
- Borders: `border-gray-200 dark:border-gray-700`

## Dashboard/Portfolio Patterns

### Data Dashboard Layout

For one-pager data dashboards with charts and stats:

```html
<main class="max-w-6xl mx-auto px-4 py-6 space-y-6">
```

Key patterns:
- `max-w-6xl` for readable content width
- `space-y-6` for consistent vertical rhythm
- Grid layouts: `grid md:grid-cols-2 gap-6` for side-by-side cards

### Hero Stats Banner

```html
<section class="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
```

Key patterns:
- Gradient backgrounds for visual interest
- Large numbers: `text-3xl md:text-4xl font-black`
- Uppercase labels: `text-xs uppercase tracking-wide`

### Quick Stats Grid

```html
<section class="grid grid-cols-2 md:grid-cols-4 gap-3">
  <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border">
```

Key patterns:
- Emoji icons for visual appeal without icon libraries
- Compact cards: `p-3` or `p-4` for tight layouts

### Progress Bars

```html
<div class="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
  <div class="h-full bg-blue-500 rounded-full" style="width: 75%"></div>
</div>
```

### Bar Charts (CSS-only)

```html
<div class="flex items-end gap-1 h-24">
  {items.map(item => (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full bg-blue-500 rounded-t" style={{ height: `${percentage}%` }} />
      <span className="text-[10px] text-slate-400 mt-1">{label}</span>
    </div>
  ))}
</div>
```

### Ranked Lists

```html
<div class="flex items-center gap-3">
  <span class="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-xs font-bold">1</span>
  <div class="flex-1">
    <span class="text-sm font-medium">{name}</span>
    <span class="text-sm font-bold text-blue-600 ml-2">{value}</span>
  </div>
</div>
```

## Resources

- `assets/landing-template.html` - Complete landing page template
- `references/design-patterns.md` - Extended patterns and examples
