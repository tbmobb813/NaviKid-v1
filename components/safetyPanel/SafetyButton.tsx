import React from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import Colors from '@/constants/colors';

type SafetyButtonProps = {
  icon: LucideIcon;
  text: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
};

export const SafetyButton: React.FC<SafetyButtonProps> = ({
  icon: Icon,
  text,
  onPress,
  isLoading = false,
  disabled = false,
}) => {
  return (
    <Pressable
      style={[styles.button, (isLoading || disabled) && styles.loadingButton]}
      onPress={onPress}
      disabled={isLoading || disabled}
    >
      <Icon size={18} color="#FFFFFF" />
      <Text style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    minHeight: 60,
    justifyContent: 'center',
  },
  loadingButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
