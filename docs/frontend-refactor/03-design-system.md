# Mzima frontend design system

This is the shared visual and interaction foundation for the landing page and the rest of the Mzima frontend. Use it to keep public pages, dashboards, and role workflows coherent without making every screen look identical.

## Tokens

### Color

| Token | Value | Intended use |
| --- | --- | --- |
| Egyptian blue | `#1034A6` | Hero, primary actions, selected headings |
| Stone blue | `#7D9BB8` | Borders, secondary surfaces, icon tints |
| Egyptian blue tint | Egyptian blue at 10% over white | Quiet section backgrounds |
| Stone blue tint | Stone blue at 15% over white | Cards and secondary section surfaces |
| Off-white | `#F5F8FC` | Main page background |
| Ink | `#0B1B3A` | Body text |
| White | `#FFFFFF` | Cards and contrast surfaces |
| Scarlet | `#FF2400` | Small live/status marker, critical icon, limited CTA/stat accents |

Check contrast for each actual foreground/background pairing; the token name alone does not ensure WCAG AA. Scarlet should remain a small accent, not a large background. Pair status colors with text or icons.

### Type

Use one geometric or humanist sans family, such as Plus Jakarta Sans or Manrope. Set headings to weight 700 and body text to weight 400. Suggested scale: 56, 40, 28, 20, 16, and 14 px. At 390 px, reduce display headings responsively while preserving hierarchy and line length. Avoid long all-caps labels and dense paragraph blocks.

### Spacing, shape, and elevation

- Base spacing unit: 8 px.
- Desktop section padding: approximately 120 px vertically; reduce at tablet/mobile breakpoints.
- Card radius: 16 px.
- Buttons and pills: fully rounded, radius 999 px.
- Use one soft blue-tinted card elevation consistently. Prefer borders or surfaces over stacking multiple shadows.
- Keep content within a centered max-width container and use consistent side gutters.

## Component contracts and states

| Component | Variants and states | Behavior |
| --- | --- | --- |
| Button | Primary, secondary, ghost; default, hover, focus, disabled, loading | 44 px minimum target; clear label; no color-only state |
| Nav link | Default, hover, focus, active | Active route uses text/shape/indicator, not color alone |
| Feature card | Default, hover, focus when interactive | Icon, short title, one-line description; static cards are not focusable |
| Service card | Default, hover/focus when actionable, disabled if unavailable | Short title and concise description; alert accent is small |
| Step card | Default, current/completed when used interactively | Number remains selectable text; sequence is understandable without color |
| Stat tile | Default | Descriptive label; no invented numerical claim |
| Status pill | Default, live, critical | Text or accessible name accompanies the color and icon |

Use native buttons for actions and links for navigation. Disabled controls need a real disabled state and an understandable reason when that helps the user. Loading actions should prevent duplicate submission and announce progress to assistive technology.

## Interaction and motion

- Decide whether motion helps feedback, spatial continuity, state indication, comprehension, or a rare moment of delight.
- Use CSS transitions for simple hover/focus changes; use more capable animation tools only when the interaction needs them.
- Animate opacity and transform. Avoid animating layout dimensions or using `transition: all`.
- Use ease-out curves; avoid `ease-in` for interface motion. Keep routine UI motion under 300 ms.
- Gate hover-only effects behind `(hover: hover) and (pointer: fine)`.
- For reduced-motion preferences, use gentler or shorter motion and preserve all information and state changes.
- Hero node pulses should be subtle and nonessential. Card lift should be small. Scroll reveals must not hide content before scripting runs.
- Do not animate elements that users trigger repeatedly throughout the day.

## Accessibility baseline

- Semantic landmarks, one clear page-level heading, and ordered heading levels.
- Visible keyboard focus with sufficient contrast; focus must not be obscured by sticky headers.
- 44 px minimum touch targets for primary controls and menu items.
- AA contrast checks for text, icons, controls, borders that convey state, and focus indicators.
- Meaningful alt text for informative diagrams; empty alt text for purely decorative imagery.
- Diagrams need an adjacent textual explanation and meaningful arrow labels.
- Errors should identify the field and explain how to correct it; announce async results appropriately.
- Do not convey urgency, access, or success using color alone.

## Suggested component organization

```text
src/
  components/
    ui/          Button, Icon, StatusPill, Card
    marketing/   MarketingHeader, Hero, FeatureCard, CapabilityCard, Footer
    dashboard/   DashboardShell, Sidebar, PageHeader, DataState
  styles/
    tokens.css
    globals.css
```

Keep component APIs small and based on meaningful intent. For example, prefer `variant="primary"` and `size="large"` over many unrelated booleans. Keep content and route behavior out of purely presentational primitives.
