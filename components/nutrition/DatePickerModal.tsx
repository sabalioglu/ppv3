import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { Calendar as CalendarPicker } from 'react-native-calendars';

import { useTheme } from '@/contexts/ThemeContext';
import { spacing, radius, shadows } from '@/lib/theme/index';
import { formatISODate } from '@/lib/nutrition/dates';

import ThemedText from '../UI/ThemedText';

const QuickButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.quickButton, { backgroundColor: `${colors.primary}` }]}
      onPress={onPress}
    >
      <ThemedText type="label">{label}</ThemedText>
    </TouchableOpacity>
  );
};

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  onSelectToday: () => void;
  onSelectYesterday: () => void;
  onSelectWeekAgo: () => void;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  selectedDate,
  onClose,
  onSelectDate,
  onSelectToday,
  onSelectYesterday,
  onSelectWeekAgo,
}) => {
  const { colors } = useTheme();
  const todayISO = formatISODate(new Date());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle" bold>
              Select Date
            </ThemedText>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <QuickButton label="Today" onPress={onSelectToday} />
            <QuickButton label="Yesterday" onPress={onSelectYesterday} />
            <QuickButton label="Week Ago" onPress={onSelectWeekAgo} />
          </View>

          {/* Calendar */}
          <CalendarPicker
            maxDate={todayISO}
            onDayPress={(day) => onSelectDate(new Date(day.dateString))}
            markedDates={{
              [formatISODate(selectedDate)]: {
                selected: true,
                selectedColor: colors.primary,
              },
            }}
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surfaceVariant,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.textOnPrimary,
              todayTextColor: colors.primary,
              dayTextColor: colors.textPrimary,
              textDisabledColor: colors.textSecondary,
              arrowColor: colors.primary,
              monthTextColor: colors.textPrimary,
              textDayFontFamily: 'Inter-Regular',
              textMonthFontFamily: 'Inter-SemiBold',
              textDayHeaderFontFamily: 'Inter-Medium',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

export default DatePickerModal;
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    borderRadius: radius.lg,
    margin: spacing.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    marginVertical: spacing.lg,
  },
  quickButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
});
