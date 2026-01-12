import { useState } from 'react';

export const useNutritionDate = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const selectToday = () => selectDate(new Date());

  const selectYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    selectDate(d);
  };

  const selectWeekAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    selectDate(d);
  };

  return {
    selectedDate,
    showCalendar,
    setShowCalendar,
    selectDate,
    selectToday,
    selectYesterday,
    selectWeekAgo,
  };
};
