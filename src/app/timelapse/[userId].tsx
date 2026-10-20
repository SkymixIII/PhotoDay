import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { TimelapsePlayer } from '../../components/TimelapsePlayer';
import { Loading, Muted, colors } from '../../components/ui';
import { getDisplayName, monthSelfies, selfieEyes, type SelfieWithUrl } from '../../lib/api';
import { monthKey, previousMonth } from '../../lib/dates';

function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return monthKey(new Date(y, m, 1));
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function Timelapse() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { width } = useWindowDimensions();
  const current = monthKey();
  const [month, setMonth] = useState(current);
  const [name, setName] = useState('');
  const [selfies, setSelfies] = useState<SelfieWithUrl[] | null>(null);

  useEffect(() => {
    getDisplayName(userId).then(setName).catch(() => {});
  }, [userId]);

  useEffect(() => {
    setSelfies(null);
    monthSelfies(userId, month).then(setSelfies).catch(() => setSelfies([]));
  }, [userId, month]);

  // Only eye-aligned photos make it into the timelapse.
  const frames = useMemo(() => (selfies ?? []).filter((s) => selfieEyes(s)), [selfies]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: name ? `Timelapse de ${name}` : 'Timelapse' }} />
      <View style={styles.months}>
        <Pressable onPress={() => setMonth(previousMonth(month))} hitSlop={12}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{monthLabel(month)}</Text>
        <Pressable onPress={() => setMonth(nextMonth(month))} disabled={month >= current} hitSlop={12}>
          <Text style={[styles.arrow, month >= current && { opacity: 0.2 }]}>›</Text>
        </Pressable>
      </View>

      {selfies === null ? (
        <Loading />
      ) : frames.length === 0 ? (
        <View style={styles.padded}>
          <Muted>Aucun selfie ce mois-ci.</Muted>
        </View>
      ) : (
        <>
          <TimelapsePlayer frames={frames} width={width} />
          <View style={styles.padded}>
            <Muted>
              {frames.length} jour{frames.length > 1 ? 's' : ''}
              {selfies.length > frames.length ? ` (${selfies.length - frames.length} sans visage détecté)` : ''}
              {month === current ? ' · le timelapse se complète jusqu’à la fin du mois' : ''}
            </Muted>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  months: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  arrow: { fontSize: 32, color: colors.primary, paddingHorizontal: 8 },
  month: { fontSize: 18, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  padded: { padding: 20 },
});
