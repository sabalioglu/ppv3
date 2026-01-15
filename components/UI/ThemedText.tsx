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
const TITLE = 'title';
const SUBTITLE = 'subtitle';

type TextType =
  | 'heading'
  | 'subheading'
  | 'body'
  | 'label'
  | 'caption'
  | 'muted'
  | 'title'
  | 'subtitle';

export interface ThemedTextProps extends TextProps {
  /**
   * @type prop helps style Text with pre-defined styling defined in
   * typography.js. Possible value of type can be:
   * 1. 'heading' // uses auths page heading style
   * 2. 'subheading' // uses auths page subheading style
   * 3. 'title' // uses tabs page title style
   * 4. 'subtitle' // uses tabs page subtitle style
   * 5. 'body'
   * 6. 'label'
   * 7. 'caption'
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
    case TITLE:
      style = 'title';
      color = colors.textPrimary;
      break;
    case SUBTITLE:
      style = 'subtitle';
      color = colors.textPrimary;
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
