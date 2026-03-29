import React from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { Plus } from 'lucide-react-native';

import { colors } from '@/constants/colors';

interface FloatingActionButtonProps {
  onPress: () => void;
  testID?: string;
  icon?: React.ReactNode;
  size?: number;
}

const FloatingActionButtonComponent: React.FC<FloatingActionButtonProps> = ({
  onPress,
  testID,
  icon,
  size = 56,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      onPress={onPress}
      testID={testID}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        {icon || <Plus size={24} color={colors.white} />}
      </View>
    </TouchableOpacity>
  );
};

FloatingActionButtonComponent.displayName = 'FloatingActionButton';

export const FloatingActionButton = React.memo(FloatingActionButtonComponent);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1000,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});