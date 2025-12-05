import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

type SafetyStatCardProps = {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  color?: string;
  onPress?: () => void;
};

export const SafetyStatCard: React.FC<SafetyStatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  color = Colors.primary,
  onPress,
}) => {
  return (
    <Pressable style={[styles.statCard, onPress && styles.pressableCard]} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        {React.cloneElement(
          icon as React.ReactElement,
          {
            size: 20,
            color,
          } as any,
        )}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
      {onPress && <ArrowRight size={16} color={Colors.textLight} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pressableCard: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: Colors.textLight,
  },
});
