import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';
import { colors } from '@/constants/colors';

interface BarChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  width?: number;
  height?: number;
  yAxisSuffix?: string;
  yAxisInterval?: number;
  formatYLabel?: (value: string) => string;
  withInnerLines?: boolean;
  withOuterLines?: boolean;
  withVerticalLines?: boolean;
  withHorizontalLines?: boolean;
  showValuesOnTopOfBars?: boolean;
}

const screenWidth = Dimensions.get('window').width;

export default function BarChart({
  data,
  width = screenWidth - 32,
  height = 220,
  yAxisSuffix = '',
  yAxisInterval = 1,
  formatYLabel,
  withInnerLines = true,
  withOuterLines = true,
  withVerticalLines = false,
  withHorizontalLines = true,
  showValuesOnTopOfBars = false,
}: BarChartProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.webFallback}>
          {/* Web fallback - could implement with CSS or a web-compatible chart library */}
        </View>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.lightGray,
      strokeWidth: 1,
    },
  };

  return (
    <View style={styles.container}>
      <RNBarChart
        data={data}
        width={width}
        height={height}
        yAxisSuffix={yAxisSuffix}
        yAxisInterval={yAxisInterval}
        formatYLabel={formatYLabel}
        chartConfig={chartConfig}
        withInnerLines={withInnerLines}
        withOuterLines={withOuterLines}
        withVerticalLines={withVerticalLines}
        withHorizontalLines={withHorizontalLines}
        showValuesOnTopOfBars={showValuesOnTopOfBars}
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  webFallback: {
    backgroundColor: colors.lightGray,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});