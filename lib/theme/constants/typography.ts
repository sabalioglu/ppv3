import { Platform } from 'react-native';

// ── Stovd brand font families (loaded in app/_layout.tsx) ──────────────
// Fraunces = editorial display serif (headings); Inter = body / UI.
// Fall back to platform system fonts if a face fails to load.
export const fonts = {
  display: 'Fraunces-SemiBold',
  displayMedium: 'Fraunces-Medium',
  displayBold: 'Fraunces-Bold',
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemibold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
};

type textprops = {
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'italic';
  fontWeight: 'normal' | 'bold' | '500' | '600';
};

export type Typography = {
  headingText: textprops;
  headingTextBold: textprops;

  subheadingText: textprops;
  subheadingTextBold: textprops;

  bodyText: textprops;
  bodyTextBold: textprops;

  title: textprops;
  titleBold: textprops;

  subtitle: textprops;
  subtitleBold: textprops;

  labelText: textprops;
  labelTextBold: textprops;

  captionText: textprops;
  captionTextBold: textprops;
};

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto-Bold',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'System',
});
const fontWeightRegular = 'normal';
const fontWeightBold = '500';

export const typography: Typography = {
  headingText: {
    fontFamily,
    fontSize: 32,
    fontStyle: 'normal',
    fontWeight: fontWeightRegular,
  },
  headingTextBold: {
    fontFamily,
    fontSize: 32,
    fontStyle: 'normal',
    fontWeight: 'bold',
  },
  subheadingText: {
    fontFamily,
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: fontWeightRegular,
  },
  subheadingTextBold: {
    fontFamily,
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: fontWeightBold,
  },
  title: {
    fontFamily,
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: fontWeightRegular,
  },
  titleBold: {
    fontFamily,
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: fontWeightBold,
  },
  subtitle: {
    fontFamily,
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: fontWeightRegular,
  },
  subtitleBold: {
    fontFamily,
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: fontWeightBold,
  },
  labelText: {
    fontFamily,
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: fontWeightRegular,
  },
  labelTextBold: {
    fontFamily,
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: fontWeightBold,
  },
  bodyText: {
    fontFamily,
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: fontWeightRegular,
  },
  bodyTextBold: {
    fontFamily,
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: fontWeightBold,
  },
  captionText: {
    fontFamily,
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: fontWeightRegular,
  },
  captionTextBold: {
    fontFamily,
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: fontWeightBold,
  },
};
