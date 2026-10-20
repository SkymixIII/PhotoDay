import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { Button, Input, Muted, Screen, Title } from '../components/ui';
import { getDisplayName, setDisplayName } from '../lib/api';
import { useUserId } from '../lib/auth';
import { scheduleDailyReminder } from '../lib/reminders';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const userId = useUserId();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDisplayName(userId).then(setName).catch(() => {});
  }, [userId]);

  async function save() {
    setSaving(true);
    await setDisplayName(userId, name).catch((e) => Alert.alert('Oups', String(e)));
    setSaving(false);
  }

  async function remind() {
    const ok = await scheduleDailyReminder(12, 0);
    Alert.alert(ok ? 'Rappel activé' : 'Notifications refusées', ok ? 'Tous les jours à midi.' : 'Active-les dans les réglages.');
  }

  return (
    <Screen>
      <Title>Ton nom</Title>
      <Muted>C'est ce que voient tes amis dans les groupes.</Muted>
      <Input value={name} onChangeText={setName} maxLength={40} />
      <Button title="Enregistrer" onPress={save} loading={saving} disabled={!name.trim()} />
      <Button title="Me rappeler chaque jour à midi" variant="ghost" onPress={remind} />
      <Button title="Se déconnecter" variant="ghost" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}
