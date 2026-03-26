import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@torah-app/api-client';
import { useAuthStore } from '@torah-app/store';

export default function AuthScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('נא למלא אימייל וסיסמה');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('נא למלא שם');
      return;
    }

    setLoading(true);
    try {
      const res = mode === 'login'
        ? await api.login({ email: email.trim(), password })
        : await api.register({ name: name.trim(), email: email.trim(), password });

      await login(res.token, res.user);
      router.replace('/(tabs)/library');
    } catch (e) {
      setError(e.message || 'שגיאה, נסה שוב');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>📖</Text>
        <Text style={styles.title}>Torah App</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'כניסה לחשבון' : 'יצירת חשבון חדש'}
        </Text>

        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="שם מלא"
            placeholderTextColor="#4a7c59"
            value={name}
            onChangeText={setName}
            textAlign="right"
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="אימייל"
          placeholderTextColor="#4a7c59"
          value={email}
          onChangeText={setEmail}
          textAlign="right"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="סיסמה (לפחות 6 תווים)"
          placeholderTextColor="#4a7c59"
          value={password}
          onChangeText={setPassword}
          textAlign="right"
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0a1f14" />
            : <Text style={styles.submitText}>
                {mode === 'login' ? 'כניסה' : 'הרשמה'}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchMode}
          onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
        >
          <Text style={styles.switchModeText}>
            {mode === 'login' ? 'אין לך חשבון? הירשם כאן' : 'כבר יש לך חשבון? כנס כאן'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d2618' },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    gap: 14,
  },
  logo: { fontSize: 60 },
  title: { color: '#e8f5e9', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#81c784', fontSize: 15, marginBottom: 8 },
  input: {
    width: '100%',
    backgroundColor: '#1a3a2a',
    color: '#e8f5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2d5c40',
  },
  error: {
    color: '#ef9a9a',
    fontSize: 13,
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#0a1f14', fontSize: 16, fontWeight: '800' },
  switchMode: { marginTop: 8 },
  switchModeText: { color: '#4caf50', fontSize: 14 },
});
