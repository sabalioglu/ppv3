import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Text, TextProps } from 'react-native';
import { typography, Typography, Colors } from '@/lib/theme/index';

const HEADING = 'heading';
const SUB_HEADING = 'subheading';
const BODY = 'body';
const LABEL = 'label';
const CAPTION = 'caption';
const MUTED = 'muted';

type TextType =
  | 'heading'
  | 'subheading'
  | 'body'
  | 'label'
  | 'caption'
  | 'muted';

export interface ThemedTextProps extends TextProps {
  /**
   * @type prop helps style Text with pre-defined styling defined in
   * typography.js. Possible value of type can be:
   * 1. 'heading'
   * 2. 'subheading'
   * 3. 'body'
   * 4. 'label'
   * 5. 'caption'
   *
   * default value: 'body'
   */
  type?: TextType;
  /**
   * @bold if enabled will use bold version of the
   * type mentioned.
   */
  bold?: boolean;
  /**
   * @style prop will overwrite the predefined styling for Text defined by
   * @type prop
   */
}

const ThemedText: React.FC<ThemedTextProps> = ({
  type = 'body',
  bold = false,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  return <Text style={[styles.text(type, bold, colors), style]} {...props} />;
};

const getTextStyle = (type: TextType, bold: boolean, colors: Colors) => {
  let style = '';
  let color = '';
  switch (type) {
    case HEADING:
      style = 'headingText';
      color = colors.textPrimary;
      break;
    case SUB_HEADING:
      style = 'subheadingText';
      color = colors.textSecondary;
      break;
    case LABEL:
      style = 'labelText';
      color = colors.textOnPrimary;
      break;
    case CAPTION:
      style = 'captionText';
      color = colors.textPrimary;
      break;
    case MUTED:
      style = 'captionText';
      color = colors.textSecondary;
      break;
    default:
      style = 'bodyText';
      color = colors.textPrimary;
  }
  if (bold) {
    style += 'Bold';
  }
  return { ...typography[style as keyof Typography], color };
};

const styles = {
  text: (type: TextType, bold: boolean, colors: Colors) => ({
    ...getTextStyle(type, bold, colors),
  }),
};

export default ThemedText;
