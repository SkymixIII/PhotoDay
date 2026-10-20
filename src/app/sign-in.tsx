import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';

import { Button, Input, Muted, Screen, Title } from '../components/ui';
import { supabase } from '../lib/supabase';

const MIN_PASSWORD = 6;

/** Email + password sign-in; "Créer un compte" signs up with the same fields. */
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'in' | 'up' | null>(null);

  const ready = email.includes('@') && password.length >= MIN_PASSWORD;

  async function signIn() {
    setBusy('in');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(null);
    if (error) Alert.alert('Connexion impossible', error.message);
  }

  async function signUp() {
    setBusy('up');
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(null);
    if (error) Alert.alert('Inscription impossible', error.message);
    // No session means Supabase still requires email confirmation.
    else if (!data.session) Alert.alert('Presque fini', 'Confirme ton adresse avec le lien reçu par email, puis connecte-toi.');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen safeTop>
        <Title>PhotoDay 📸</Title>
        <Muted>Un selfie par jour, partagé avec tes amis. À la fin du mois, ton timelapse.</Muted>
        <Input
          placeholder="ton@email.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          placeholder={`Mot de passe (${MIN_PASSWORD} caractères min.)`}
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />
        <Button title="Se connecter" onPress={signIn} loading={busy === 'in'} disabled={!ready || busy !== null} />
        <Button title="Créer un compte" variant="ghost" onPress={signUp} loading={busy === 'up'} disabled={!ready || busy !== null} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
