import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Muted, Screen, Title, colors } from '../components/ui';
import { hasSelfieOn, myGroups, type Group } from '../lib/api';
import { useUserId } from '../lib/auth';
import { dayKey } from '../lib/dates';

export default function Home() {
  const userId = useUserId();
  const [groups, setGroups] = useState<Group[]>([]);
  const [doneToday, setDoneToday] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      myGroups().then(setGroups).catch(console.warn);
      hasSelfieOn(userId, dayKey()).then(setDoneToday).catch(console.warn);
    }, [userId]),
  );

  return (
    <Screen>
      <View style={styles.today}>
        <Title>{doneToday ? 'Selfie du jour envoyé ✅' : "Ton selfie d'aujourd'hui"}</Title>
        <Button
          title={doneToday ? 'Reprendre mon selfie' : 'Prendre mon selfie'}
          variant={doneToday ? 'ghost' : 'primary'}
          onPress={() => router.push('/capture')}
        />
        <Button title="Mon timelapse" variant="ghost" onPress={() => router.push(`/timelapse/${userId}`)} />
      </View>

      <View style={styles.row}>
        <Text style={styles.section}>Mes groupes</Text>
        <Link href="/profile" style={styles.link}>
          Profil
        </Link>
      </View>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        ListEmptyComponent={<Muted>Crée un groupe ou rejoins celui de tes amis avec leur code.</Muted>}
        renderItem={({ item }) => (
          <Pressable style={styles.group} onPress={() => router.push(`/groups/${item.id}`)}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
      <Button title="Créer ou rejoindre un groupe" onPress={() => router.push('/groups/new')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  today: { gap: 10, paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { fontSize: 18, fontWeight: '700', color: colors.text },
  link: { color: colors.primary, fontSize: 16 },
  group: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  groupName: { fontSize: 17, color: colors.text },
  chevron: { fontSize: 20, color: colors.muted },
});
