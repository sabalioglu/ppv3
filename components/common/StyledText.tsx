// components/common/StyledText.tsx
import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { TextVariantKey, FontWeightKey } from '@/constants/Typography';

interface StyledTextProps extends TextProps {
  variant?: TextVariantKey;
  weight?: FontWeightKey;
  color?: string;
  children: React.ReactNode;
}

export const StyledText: React.FC<StyledTextProps> = ({
  variant = 'bodyRegular',
  weight,
  color,
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();
  
  // Get the base variant style
  const variantStyle = theme.textVariants[variant];
  
  // Override font family if weight is specified
  const fontFamily = weight ? theme.getFontFamily(weight) : variantStyle.fontFamily;
  
  // Combine styles
  const textStyle: TextStyle = {
    ...variantStyle,
    fontFamily,
    fontWeight: weight ? theme.fontWeights[weight] : undefined,
    color: color || theme.colors.text,
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
};

// Convenience components for common text variants
export const H1: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="h1" {...props} />
);

export const H2: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="h2" {...props} />
);

export const H3: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="h3" {...props} />
);

export const H4: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="h4" {...props} />
);

export const H5: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="h5" {...props} />
);

export const H6: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="h6" {...props} />
);

export const BodyLarge: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="bodyLarge" {...props} />
);

export const BodyRegular: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="bodyRegular" {...props} />
);

export const BodySmall: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="bodySmall" {...props} />
);

export const ButtonText: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="button" {...props} />
);

export const Caption: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="caption" {...props} />
);

export const Label: React.FC<Omit<StyledTextProps, 'variant'>> = (props) => (
  <StyledText variant="label" {...props} />
);