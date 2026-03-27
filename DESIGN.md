# Velocity Dark: Design System Specification

## 1. Overview & Creative North Star: "The Synthetic Arena"

Velocity Dark is a high-performance, dark-mode design system tailored for sports management and live game tracking. It balances "Pro-Level Data" with "Street Athletics" aesthetics, using deep navy tones and high-visibility neon accents to create an immersive, editorial experience.

## 2. Visual Foundation

### Color Palette

- **Background (Primary):** `#111827` (Deep Midnight Navy) – Used for main screen backgrounds.
- **Surface (Secondary):** `#1F2937` – Used for cards, containers, and elevated sections.
- **Primary Accent:** `#CCFF33` (Volt/Electric Lime) – Used for primary CTA buttons, active navigation states, and highlighting key metrics.
- **Secondary Accents (System):**
    - **Success/Positive:** `#10B981` (Emerald Green)
    - **Alert/Action:** `#EF4444` (Vibrant Red)
    - **Info/Secondary:** `#3B82F6` (Electric Blue)
- **Typography (Neutrals):**
    - **High Emphasis:** `#FFFFFF` (Pure White)
    - **Medium Emphasis:** `#9CA3AF` (Cool Gray)
    - **Low Emphasis/Disabled:** `#4B5563`

### Typography

- **Primary Font:** `Lexend` – Chosen for its geometric clarity and readability in data-heavy environments.
- **Hierarchy:**
    - **H1 (Headline):** 24px-28px, Bold – Welcoming, impactful headers.
    - **H2 (Section Header):** 18px-20px, Semi-Bold – Card titles and major sections.
    - **Body (Primary):** 14px-16px, Regular – Standard labels and details.
    - **Caption:** 12px, Regular/Medium – Supporting metadata, dates, and minor labels.

## 3. Mantine Implementation & Theming

To ensure technical consistency, the Velocity Dark system maps directly to Mantine's `MantineThemeOverride`.

### Theme Configuration

```javascript
const velocityDarkTheme = {
    colorScheme: "dark",
    fontFamily: "Lexend, sans-serif",
    primaryColor: "volt", // Custom color key
    colors: {
        dark: [
            "#C1C2C5", // 0
            "#A6A7AB", // 1
            "#909296", // 2
            "#5C5F66", // 3
            "#373A40", // 4
            "#2C2E33", // 5
            "#25262B", // 6
            "#1F2937", // 7 (Surface)
            "#111827", // 8 (Background)
            "#0B0E14", // 9
        ],
        lime: [
            "#F4FFE0",
            "#E9FFB3",
            "#DFFF85",
            "#D4FF57",
            "#CCFF33",
            "#B8E62E",
            "#A3CC29",
            "#8FB224",
            "#7A991F",
            "#66801A",
        ],
    },
    headings: {
        fontFamily: "Lexend, sans-serif",
        fontWeight: 700,
    },
    defaultRadius: "md", // Maps to ROUND_EIGHT
};
```

### Component Defaults

- **Card:** Use `withBorder` with a dark.4 or dark.5 color for the border.
- **Button:** Primary buttons use `color="volt"` and `variant="filled"`.
- **Accordion:** Use the `separated` variant to match the structured UI pattern.

## 4. UI Components

### Cards & Containers

- **Corner Radius:** `ROUND_EIGHT` (8px-12px) – Subtle rounding for a modern, structured look.
- **Stroke:** 1px border using `#374151` for subtle definition on dark backgrounds.
- **Padding:** Consistent 16px internal padding for most containers.

### Buttons & Navigation

- **Primary CTA:** Solid `#CCFF33` with black text. Pill-shaped or heavily rounded for high visibility.
- **Secondary Actions:** Dark surface with white or grey text, or outlined variants.
- **Bottom Navigation:** Fixed persistent bar with clear iconography. Active states use the Primary Accent.

### Live Scoring & Interaction

- **Diamond Layout:** Intuitive visual representation of the baseball diamond for positioning and runner advancement.
- **Action Drawers:** Mantine `Drawer` or `Modal` components for quick-fire decisions.
- **Status Indicators:** Color-coded badges for Outs, Counts, and Score.

## 5. Layout Principles

- **Content Density:** Data-rich but uncluttered.
- **Spacing System:** Base 4px grid (Mantine spacing: xs=4, sm=8, md=16, lg=24, xl=32).
- **Mobile-First Design:** Optimized for one-handed operation during live games.
