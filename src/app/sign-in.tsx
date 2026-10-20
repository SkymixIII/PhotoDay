import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';

import { Button, Input, Muted, Screen, Title } from '../components/ui';
import { supabase } from '../lib/supabase';

/** Passwordless sign-in: email -> 6-digit code. */
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setBusy(false);
    if (error) Alert.alert('Erreur', error.message);
    else setCodeSent(true);
  }

  async function verify() {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) Alert.alert('Code invalide', error.message);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Title>PhotoDay 📸</Title>
        <Muted>Un selfie par jour, partagé avec tes amis. À la fin du mois, ton timelapse.</Muted>
        <Input
          placeholder="ton@email.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!codeSent}
        />
        {codeSent ? (
          <>
            <Input placeholder="Code reçu par email" keyboardType="number-pad" value={code} onChangeText={setCode} />
            <Button title="Se connecter" onPress={verify} loading={busy} disabled={code.trim().length < 6} />
            <Button title="Changer d'email" variant="ghost" onPress={() => setCodeSent(false)} />
          </>
        ) : (
          <Button title="Recevoir un code" onPress={sendCode} loading={busy} disabled={!email.includes('@')} />
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
