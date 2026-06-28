import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlayerStore } from '@torah-app/store';

export function LoginGateModal() {
  const visible = usePlayerStore((s) => s.loginGateVisible);
  const dismiss = usePlayerStore((s) => s.dismissLoginGate);
  const router = useRouter();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={dismiss}>
      <Pressable style={s.overlay} onPress={dismiss}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <Pressable style={s.closeBtn} onPress={dismiss}>
            <Text style={s.closeTxt}>✕</Text>
          </Pressable>
          <Text style={s.icon}>📚</Text>
          <Text style={s.title}>הגעת למגבלת החינמי</Text>
          <Text style={s.body}>האזנת ל-5 שיעורים החודש. כנס לחשבון כדי להמשיך להאזין.</Text>
          <Pressable
            style={s.loginBtn}
            onPress={() => { dismiss(); router.push('/auth'); }}
          >
            <Text style={s.loginTxt}>כניסה / הרשמה</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: '#000000aa',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  sheet: {
    backgroundColor: '#0a1f14', borderWidth: 1, borderColor: '#1a3a2a',
    borderRadius: 20, padding: 32, width: '100%', maxWidth: 380,
    alignItems: 'center', gap: 14,
  },
  closeBtn: { position: 'absolute', top: 14, right: 16, padding: 4 },
  closeTxt: { color: '#4a7c59', fontSize: 20 },
  icon: { fontSize: 52 },
  title: { color: '#e8f5e9', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  body: { color: '#81c784', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  loginBtn: {
    backgroundColor: '#4caf50', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 36, marginTop: 6,
  },
  loginTxt: { color: '#0a1f14', fontWeight: '800', fontSize: 15 },
});
