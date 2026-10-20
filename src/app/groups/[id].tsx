import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Pressable, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button, Muted, colors } from '../../components/ui';
import { getGroup, groupMembers, leaveGroup, selfiesOn, type Group, type Member, type SelfieWithUrl } from '../../lib/api';
import { useUserId } from '../../lib/auth';
import { dayKey } from '../../lib/dates';

const COLUMNS = 2;

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const { width } = useWindowDimensions();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [today, setToday] = useState<Map<string, SelfieWithUrl>>(new Map());

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [g, m] = await Promise.all([getGroup(id), groupMembers(id)]);
        setGroup(g);
        setMembers(m);
        const selfies = await selfiesOn(
          m.map((x) => x.user_id),
          dayKey(),
        );
        setToday(new Map(selfies.map((s) => [s.user_id, s])));
      })().catch((e) => Alert.alert('Oups', String(e)));
    }, [id]),
  );

  function invite() {
    if (!group) return;
    Share.share({ message: `Rejoins « ${group.name} » sur PhotoDay avec le code ${group.invite_code}` });
  }

  function leave() {
    Alert.alert('Quitter le groupe ?', 'Tes amis ne verront plus tes selfies.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter',
        style: 'destructive',
        onPress: () => leaveGroup(id, userId).then(() => router.back()),
      },
    ]);
  }

  const tile = (width - 20 * 2 - 12 * (COLUMNS - 1)) / COLUMNS;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: group?.name ?? 'Groupe' }} />
      <FlatList
        data={members}
        numColumns={COLUMNS}
        keyExtractor={(m) => m.user_id}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, padding: 20 }}
        ListHeaderComponent={
          <View style={{ gap: 8 }}>
            <Text style={styles.section}>Aujourd'hui</Text>
            <Muted>Touche un ami pour voir son timelapse du mois.</Muted>
          </View>
        }
        renderItem={({ item }) => {
          const selfie = today.get(item.user_id);
          return (
            <Pressable style={{ width: tile }} onPress={() => router.push(`/timelapse/${item.user_id}`)}>
              {selfie ? (
                <Image source={{ uri: selfie.url }} style={[styles.photo, { width: tile, height: tile * 1.33 }]} />
              ) : (
                <View style={[styles.photo, styles.empty, { width: tile, height: tile * 1.33 }]}>
                  <Text style={styles.emptyText}>Pas encore 💤</Text>
                </View>
              )}
              <Text style={styles.name} numberOfLines={1}>
                {item.user_id === userId ? 'Moi' : item.display_name}
              </Text>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View style={{ gap: 12, marginTop: 12 }}>
            {group && <Muted>Code d'invitation : {group.invite_code}</Muted>}
            <Button title="Inviter des amis" onPress={invite} />
            <Button title="Quitter le groupe" variant="ghost" onPress={leave} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  section: { fontSize: 18, fontWeight: '700', color: colors.text },
  photo: { borderRadius: 12, backgroundColor: colors.border },
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.muted },
  name: { marginTop: 6, fontSize: 15, color: colors.text },
});
