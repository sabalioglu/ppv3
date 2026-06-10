// components/library/modals/EditCookbookBottomSheet.tsx
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView as RNScrollView,
} from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, type Colors } from '@/lib/theme/index';
import { colors as palette } from '@/lib/theme/index';
import { supabase } from '../../../lib/supabase';

interface EditCookbookBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  cookbook: {
    id: string;
    name: string;
    description?: string;
    emoji: string;
    color: string;
  };
  onUpdate: () => void;
}

const EMOJI_OPTIONS = [
  '📚',
  '🍳',
  '🥘',
  '🍰',
  '🥗',
  '🍕',
  '🍜',
  '🥐',
  '🍱',
  '🌮',
];
const COLOR_OPTIONS = [
  palette.primary[500],
  palette.secondary[500],
  palette.accent[500],
  palette.success[500],
  palette.warning[500],
  palette.error[500],
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#10B981',
];

export const EditCookbookBottomSheet: React.FC<
  EditCookbookBottomSheetProps
> = ({ visible, onClose, cookbook, onUpdate }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%', '90%'], []);

  const [name, setName] = useState(cookbook.name);
  const [description, setDescription] = useState(cookbook.description || '');
  const [selectedEmoji, setSelectedEmoji] = useState(cookbook.emoji);
  const [selectedColor, setSelectedColor] = useState(cookbook.color);
  const [loading, setLoading] = useState(false);

  // Check if this is a new cookbook
  const isNewCookbook = cookbook.id === 'new';

  useEffect(() => {
    if (visible) {
      setName(cookbook.name);
      setDescription(cookbook.description || '');
      setSelectedEmoji(cookbook.emoji);
      setSelectedColor(cookbook.color);
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, cookbook]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Cookbook name is required');
      return;
    }

    setLoading(true);
    try {
      if (isNewCookbook) {
        // Create new cookbook
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert('Error', 'Please log in to create cookbooks');
          return;
        }

        const { error } = await supabase.from('cookbooks').insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          emoji: selectedEmoji,
          color: selectedColor,
        });

        if (error) throw error;
        Alert.alert('Success!', 'Cookbook created successfully');
      } else {
        // Update existing cookbook
        const { error } = await supabase
          .from('cookbooks')
          .update({
            name: name.trim(),
            description: description.trim() || null,
            emoji: selectedEmoji,
            color: selectedColor,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cookbook.id);

        if (error) throw error;
        Alert.alert('Success!', 'Cookbook updated successfully');
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error(
        `Error ${isNewCookbook ? 'creating' : 'updating'} cookbook:`,
        error,
      );
      Alert.alert(
        'Error',
        `Failed to ${isNewCookbook ? 'create' : 'update'} cookbook`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      onClose={onClose}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.bottomSheetBackground}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isNewCookbook ? 'Create Cookbook' : 'Edit Cookbook'}
          </Text>
          <TouchableOpacity onPress={handleUpdate} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.saveText}>
                {isNewCookbook ? 'Create' : 'Save'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <BottomSheetScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <BottomSheetTextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="My Cookbook"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <BottomSheetTextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="A collection of my favorite recipes..."
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Emoji</Text>
            <RNScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.emojiContainer}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      selectedEmoji === emoji && styles.emojiOptionSelected,
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </RNScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.colorContainer}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>

          {/* Spacer so the Color section can scroll above the keyboard */}
          <View style={{ height: 320 }} />
        </BottomSheetScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
};

const getStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    handleIndicator: {
      backgroundColor: colors.border,
    },
    bottomSheetBackground: {
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    saveText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    formGroup: {
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    emojiContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    emojiOption: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: palette.primary[50],
    },
    emojiText: {
      fontSize: 24,
    },
    colorContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    colorOption: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 3,
      borderColor: 'transparent',
    },
    colorOptionSelected: {
      borderColor: colors.textPrimary,
    },
  });
