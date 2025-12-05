import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type FunThingsListProps = {
  things: string[];
};

export const FunThingsList: React.FC<FunThingsListProps> = ({ things }) => {
  if (!things || things.length === 0) {
    return null;
  }

  return (
    <View style={styles.funThingsContainer}>
      <Text style={styles.funThingsTitle}>👀 Look for:</Text>
      {things.map((thing, index) => (
        <Text key={index} style={styles.funThing}>
          • {thing}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  funThingsContainer: {
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  funThingsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B1FA2',
    marginBottom: 6,
  },
  funThing: {
    fontSize: 12,
    color: '#7B1FA2',
    lineHeight: 16,
  },
});
