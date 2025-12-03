import React from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import Colors from '@/constants/colors';

type QuickActionButtonProps = {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  color?: string;
};

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  title,
  onPress,
  color = Colors.primary,
}) => (
  <Pressable style={[styles.quickActionButton, { backgroundColor: color }]} onPress={onPress}>
    {React.cloneElement(
      icon as React.ReactElement,
      {
        size: 20,
        color: '#FFFFFF',
      } as any,
    )}
    <Text style={styles.quickActionText}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  quickActionButton: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
