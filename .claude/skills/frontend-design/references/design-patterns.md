# Extended Design Patterns

## Tailwind Configuration

```javascript
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#137fec",
                "background-light": "#ffffff",
                "background-dark": "#101922",
                "slate-light": "#f8fafc",
                "slate-dark": "#1e293b"
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                "sans": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.375rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "full": "9999px"
            },
        },
    },
}
```

## Required External Resources

```html
<!-- Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet"/>

<!-- Material Icons -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

<!-- Tailwind CDN -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
```

## Animation Patterns

### Ping Animation (for badges)

```html
<span class="relative flex h-2 w-2">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
    <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
</span>
```

### Hover Scale (for icons)

```html
<div class="group">
    <div class="group-hover:scale-110 transition-transform">
        <!-- icon content -->
    </div>
</div>
```

### Shimmer Progress Bar

```css
@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
}
```

```html
<div class="w-full h-1 bg-gray-200 rounded-full overflow-hidden relative">
    <div class="absolute inset-0 bg-primary w-1/2 animate-[shimmer_2s_infinite]"></div>
</div>
```

## Button Styles

### Primary CTA

```html
<a href="#" class="flex items-center justify-center h-12 px-6 rounded-lg bg-primary text-white text-base font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-primary/25 gap-2">
    <span>Button Text</span>
    <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
</a>
```

### Secondary/Ghost Button

```html
<a href="#" class="flex items-center justify-center h-12 px-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111418] dark:text-white text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors gap-2">
    <span class="material-symbols-outlined text-[20px]">visibility</span>
    <span>Button Text</span>
</a>
```

### Header Button (small)

```html
<a class="flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-sm hover:shadow-md" href="#">
    Button Text
</a>
```

## Card Patterns

### Feature Card

```html
<div class="relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group">
    <div class="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
        <span class="material-symbols-outlined text-3xl">icon_name</span>
    </div>
    <h3 class="text-xl font-bold text-[#111418] dark:text-white mb-3">Title</h3>
    <p class="text-gray-600 dark:text-gray-400 mb-4">Description text</p>
</div>
```

### Testimonial Card

```html
<div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
    <div class="flex gap-1 text-yellow-400 mb-4">
        <span class="material-symbols-outlined fill-current text-sm">star</span>
        <!-- repeat for 5 stars -->
    </div>
    <p class="text-gray-700 dark:text-gray-300 italic mb-6 flex-grow">"Quote text"</p>
    <div class="flex items-center gap-4">
        <div class="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
            <img alt="Name" class="h-full w-full object-cover" src="avatar.jpg"/>
        </div>
        <div>
            <p class="font-bold text-[#111418] dark:text-white">Name</p>
            <p class="text-sm text-gray-500">Title</p>
        </div>
    </div>
</div>
```

## Layout Containers

### Max-width Section Container

```html
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

### Centered Text Block

```html
<div class="text-center max-w-3xl mx-auto mb-16">
    <h2 class="text-3xl font-bold text-[#111418] dark:text-white sm:text-4xl mb-4">Heading</h2>
    <p class="text-lg text-gray-600 dark:text-gray-300">Subheading text</p>
</div>
```

## Icon Usage

Use Material Symbols Outlined with custom sizing:

```html
<span class="material-symbols-outlined text-[20px]">icon_name</span>
<span class="material-symbols-outlined text-3xl">icon_name</span>
<span class="material-symbols-outlined !text-[32px]">icon_name</span>
```

Common icons: `flight_takeoff`, `check_circle`, `arrow_forward`, `visibility`, `cloud_upload`, `person_check`, `download`, `picture_as_pdf`, `badge`, `analytics`, `verified`, `star`

## Background Effects

### Gradient Blur

```html
<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-100 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl -z-10"></div>
```

### Dot Pattern Overlay

```html
<div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 20px 20px;"></div>
```
