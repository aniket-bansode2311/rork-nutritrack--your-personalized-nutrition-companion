import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';

interface ModernCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
  borderRadius?: number;
  elevated?: boolean;
  testID?: string;
}

const ModernCardComponent: React.FC<ModernCardProps> = ({
  children,
  style,
  padding = 24,
  margin = 8,
  borderRadius = 20,
  elevated = true,
  testID,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          padding,
          marginVertical: margin,
          marginHorizontal: 16,
          borderRadius,
          ...(elevated && styles.elevated),
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

ModernCardComponent.displayName = 'ModernCard';

export const ModernCard = React.memo(ModernCardComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  elevated: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});