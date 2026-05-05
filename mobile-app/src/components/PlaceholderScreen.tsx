import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from './Screen';

interface PlaceholderScreenProps {
  title: string;
  description: string;
}

export default function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  title: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
  },
  description: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 15,
    lineHeight: 22,
  },
});
