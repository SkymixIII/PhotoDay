import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Button, Input, Muted, Screen, Title } from '../../components/ui';
import { createGroup, joinGroup, type Group } from '../../lib/api';

export default function NewGroup() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);

  async function run(kind: 'create' | 'join', action: () => Promise<Group>) {
    setBusy(kind);
    try {
      const group = await action();
      router.replace(`/groups/${group.id}`);
    } catch (e) {
      Alert.alert('Oups', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <Title>Créer un groupe</Title>
      <Input placeholder="Nom du groupe" value={name} onChangeText={setName} maxLength={60} />
      <Button
        title="Créer"
        onPress={() => run('create', () => createGroup(name))}
        loading={busy === 'create'}
        disabled={!name.trim()}
      />

      <Title>Rejoindre un groupe</Title>
      <Muted>Demande le code d'invitation à un ami du groupe.</Muted>
      <Input placeholder="Code (ex. 3F9A1C2B)" autoCapitalize="characters" value={code} onChangeText={setCode} />
      <Button
        title="Rejoindre"
        variant="ghost"
        onPress={() => run('join', () => joinGroup(code))}
        loading={busy === 'join'}
        disabled={code.trim().length < 4}
      />
    </Screen>
  );
}
