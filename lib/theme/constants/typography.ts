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

// Brand faces already carry their weight in the family name, so fontWeight
// stays 'normal' (a weighted family + a bold fontWeight breaks on Android).
const w = 'normal' as const;

export const typography: Typography = {
  // Editorial serif (Fraunces) — display + section headings ("cookbook" voice)
  headingText: {
    fontFamily: fonts.display,
    fontSize: 32,
    fontStyle: 'normal',
    fontWeight: w,
  },
  headingTextBold: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    fontStyle: 'normal',
    fontWeight: w,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: w,
  },
  titleBold: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: w,
  },
  subtitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: w,
  },
  subtitleBold: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: w,
  },

  // Sans (Inter) — body / UI / supporting copy
  subheadingText: {
    fontFamily: fonts.body,
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: w,
  },
  subheadingTextBold: {
    fontFamily: fonts.bodySemibold,
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: w,
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: w,
  },
  bodyTextBold: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: w,
  },
  labelText: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: w,
  },
  labelTextBold: {
    fontFamily: fonts.bodySemibold,
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: w,
  },
  captionText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: w,
  },
  captionTextBold: {
    fontFamily: fonts.bodySemibold,
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: w,
  },
};
