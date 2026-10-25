// bridges real Cloudscape design tokens into our CSS custom properties, no bundler required
import {
  colorBackgroundCard,
  colorBorderDividerDefault,
  colorTextBodyDefault,
  colorTextBodySecondary,
  colorBackgroundHomeHeader,
  colorTextAccent,
  colorTextStatusSuccess,
  colorTextStatusError,
  colorTextStatusWarning,
  borderRadiusContainer,
  borderRadiusInput,
  fontFamilyBase,
  colorChartsPaletteCategorical1,
  colorChartsPaletteCategorical2,
  colorChartsPaletteCategorical3,
  colorChartsPaletteCategorical4,
  colorChartsPaletteCategorical5,
  colorChartsPaletteCategorical6,
  colorChartsPaletteCategorical7,
  colorChartsPaletteCategorical8,
  colorChartsPaletteCategorical9
} from "@cloudscape-design/design-tokens";

const root = document.documentElement.style;

// tokens resolve to their light fallbacks without the React bundle, dark values live in main.css.
// the layout background stays in main.css: its white fallback makes cards blend into the page
root.setProperty("--color-bg-card", colorBackgroundCard);
root.setProperty("--color-border-strong", colorBorderDividerDefault);
root.setProperty("--color-text", colorTextBodyDefault);
root.setProperty("--color-text-secondary", colorTextBodySecondary);
root.setProperty("--color-navy", colorBackgroundHomeHeader);
root.setProperty("--color-blue", colorTextAccent);
root.setProperty("--color-green", colorTextStatusSuccess);
root.setProperty("--color-red", colorTextStatusError);
root.setProperty("--color-orange-text", colorTextStatusWarning);
root.setProperty("--radius", borderRadiusContainer);
root.setProperty("--radius-input", borderRadiusInput);
root.setProperty("--font-family-base", fontFamilyBase);

// real Cloudscape categorical chart palette
export const chartPalette = [
  colorChartsPaletteCategorical1,
  colorChartsPaletteCategorical2,
  colorChartsPaletteCategorical3,
  colorChartsPaletteCategorical4,
  colorChartsPaletteCategorical5
];

// darker half of the palette, keeps white initials readable
export const avatarPalette = [
  colorChartsPaletteCategorical6,
  colorChartsPaletteCategorical7,
  colorChartsPaletteCategorical8,
  colorChartsPaletteCategorical9,
  colorChartsPaletteCategorical2,
  colorChartsPaletteCategorical4
];
