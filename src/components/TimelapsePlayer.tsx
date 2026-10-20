import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { SelfieWithUrl } from '../lib/api';
import { AlignedFrame } from './AlignedFrame';

/** Plays aligned selfies in a loop; tap to pause / resume. */
export function TimelapsePlayer({ frames, width, fps = 6 }: { frames: SelfieWithUrl[]; width: number; fps?: number }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIndex(0);
    setReady(false);
    Promise.all(frames.map((f) => Image.prefetch(f.url).catch(() => false))).then(() => {
      setReady(true);
      setPlaying(true);
    });
  }, [frames]);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % frames.length), 1000 / fps);
    return () => clearInterval(id);
  }, [playing, frames.length, fps]);

  const frame = frames[index];
  if (!frame) return null;

  return (
    <Pressable onPress={() => setPlaying((p) => !p)} disabled={!ready}>
      <AlignedFrame selfie={frame} width={width} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {ready ? `${frame.taken_on.slice(8)}/${frame.taken_on.slice(5, 7)}${playing ? '' : '  ⏸'}` : 'Chargement…'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { color: '#fff', fontWeight: '600' },
});
