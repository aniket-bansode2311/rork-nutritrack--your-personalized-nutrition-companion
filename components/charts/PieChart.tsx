import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';
import { colors } from '@/constants/colors';

interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface PieChartProps {
  data: PieChartData[];
  width?: number;
  height?: number;
  chartConfig?: any;
  accessor?: string;
  backgroundColor?: string;
  paddingLeft?: string;
  center?: number[];
  absolute?: boolean;
  hasLegend?: boolean;
  avoidFalseZero?: boolean;
}

const screenWidth = Dimensions.get('window').width;

export default function PieChart({
  data,
  width = screenWidth - 32,
  height = 220,
  accessor = 'population',
  backgroundColor = 'transparent',
  paddingLeft = '15',
  center = [10, 50],
  absolute = false,
  hasLegend = true,
  avoidFalseZero = false,
}: PieChartProps) {
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
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  return (
    <View style={styles.container}>
      <RNPieChart
        data={data}
        width={width}
        height={height}
        chartConfig={chartConfig}
        accessor={accessor}
        backgroundColor={backgroundColor}
        paddingLeft={paddingLeft}
        center={center}
        absolute={absolute}
        hasLegend={hasLegend}
        avoidFalseZero={avoidFalseZero}
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