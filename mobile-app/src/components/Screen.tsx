import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
  padding?: number;
}

export default function Screen({
  children,
  scroll = false,
  keyboard = true,
  padding = 16,
}: ScreenProps) {
  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[{ padding, flexGrow: 1 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, padding }]}>{children}</View>
  );

  const content = keyboard ? (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {inner}
    </KeyboardAvoidingView>
  ) : inner;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      {content}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
});
