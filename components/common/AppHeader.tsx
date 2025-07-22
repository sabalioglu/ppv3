// components/common/AppHeader.tsx
import React from 'react';
import { View, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { StyledText } from './StyledText';
import { useTheme } from '@/contexts/ThemeContext';
import { headerStyles } from '@/constants/Typography';

interface AppHeaderProps {
  title: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  leftComponent,
  rightComponent,
  backgroundColor,
  titleColor,
}) => {
  const { theme } = useTheme();

  const containerStyle = {
    ...headerStyles.container,
    backgroundColor: backgroundColor || theme.colors.surface,
    borderBottomColor: theme.colors.borderLight,
  };

  return (
    <SafeAreaView style={{ backgroundColor: backgroundColor || theme.colors.surface }}>
      <View style={containerStyle}>
        {leftComponent && (
          <View style={headerStyles.leftAction}>
            {leftComponent}
          </View>
        )}
        
        <StyledText 
          variant="h2" 
          weight="bold"
          color={titleColor || theme.colors.textPrimary}
          style={styles.titleText}
        >
          {title}
        </StyledText>
        
        {rightComponent && (
          <View style={headerStyles.rightAction}>
            {rightComponent}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  titleText: {
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 60, // Space for left/right components
  },
});