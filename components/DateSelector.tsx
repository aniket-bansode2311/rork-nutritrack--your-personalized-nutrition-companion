import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { colors } from '@/constants/colors';

interface DateSelectorProps {
  date: string; // ISO format: YYYY-MM-DD
  onDateChange: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ date, onDateChange }) => {
  const currentDate = new Date(date);
  
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };
  
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate.toISOString().split('T')[0]);
  };
  
  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    const today = new Date();
    
    // Don't allow selecting future dates
    if (newDate <= today) {
      onDateChange(newDate.toISOString().split('T')[0]);
    }
  };
  
  const goToToday = () => {
    const today = new Date();
    onDateChange(today.toISOString().split('T')[0]);
  };
  
  return (
    <View style={styles.container} testID="date-selector">
      <TouchableOpacity 
        onPress={goToPreviousDay} 
        style={styles.arrowButton}
        testID="previous-day-button"
      >
        <ChevronLeft size={24} color={colors.darkGray} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={goToToday} 
        style={styles.dateContainer}
        testID="today-button"
      >
        <Text style={styles.dateText}>
          {formatDate(currentDate)}
          {isToday(currentDate) && <Text style={styles.todayText}> (Today)</Text>}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={goToNextDay} 
        style={[
          styles.arrowButton,
          // Disable next day button if current date is today
          isToday(currentDate) && styles.disabledButton
        ]}
        disabled={isToday(currentDate)}
        testID="next-day-button"
      >
        <ChevronRight size={24} color={isToday(currentDate) ? colors.mediumGray : colors.darkGray} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  arrowButton: {
    padding: 8,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  todayText: {
    fontWeight: 'normal',
    color: colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
});