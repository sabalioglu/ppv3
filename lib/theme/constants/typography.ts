import { Platform } from 'react-native';

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
