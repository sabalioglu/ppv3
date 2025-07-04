// components/RecipeImportLoader.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';
import { getLoadingMessages, LoadingMessage } from '@/lib/loadingMessages';

interface RecipeImportLoaderProps {
  visible: boolean;
  url: string;
  onComplete?: () => void;
}

export const RecipeImportLoader: React.FC<RecipeImportLoaderProps> = ({
  visible,
  url,
  onComplete
}) => {
  const [currentMessage, setCurrentMessage] = useState<LoadingMessage | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [messages, setMessages] = useState<LoadingMessage[]>([]);

  useEffect(() => {
    if (visible && url) {
      const loadingMessages = getLoadingMessages(url);
      setMessages(loadingMessages);
      setMessageIndex(0);
      setCurrentMessage(loadingMessages[0]);
    }
  }, [visible, url]);

  useEffect(() => {
    if (!visible || messages.length === 0) return;

    const timer = setTimeout(() => {
      const nextIndex = (messageIndex + 1) % messages.length;
      setMessageIndex(nextIndex);
      setCurrentMessage(messages[nextIndex]);
      
      // If we've cycled through all messages, call onComplete
      if (nextIndex === 0 && messageIndex > 0) {
        onComplete?.();
      }
    }, currentMessage?.duration || 2000);

    return () => clearTimeout(timer);
  }, [messageIndex, messages, currentMessage, visible, onComplete]);

  if (!visible || !currentMessage) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.message}>{currentMessage.text}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((messageIndex + 1) / messages.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {messageIndex + 1} of {messages.length}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: colors.neutral[0],
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: '80%',
    minWidth: 280,
  },
  message: {
    fontSize: typography.fontSize.lg,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Medium',
    fontWeight: '500',
    color: colors.neutral[800],
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
    color: colors.neutral[500],
  },
});
