import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Muted, Screen, Title } from '../components/ui';
import type { Eyes } from '../lib/alignment';
import { uploadSelfie } from '../lib/api';
import { useUserId } from '../lib/auth';
import { dayKey } from '../lib/dates';
import { detectEyes } from '../lib/faces';

type Shot = { uri: string; width: number; height: number; eyes: Eyes | null };

/** Width selfies are stored at; eye coordinates are in this pixel space. */
const STORED_WIDTH = 1080;

export default function Capture() {
  const userId = useUserId();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [shot, setShot] = useState<Shot | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  if (!permission) return <Screen />;
  if (!permission.granted) {
    return (
      <Screen safeTop>
        <Title>Accès à la caméra</Title>
        <Muted>PhotoDay a besoin de la caméra frontale pour ton selfie du jour.</Muted>
        <Button title="Autoriser" onPress={requestPermission} />
        <Button title="Annuler" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  async function takePicture() {
    if (!camera.current || !cameraReady || busy) return;
    setBusy(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 1 });
      if (!photo) throw new Error("La caméra n'a pas renvoyé de photo");
      // Resize first so the stored file is light and orientation is baked in.
      const rendered = await ImageManipulator.manipulate(photo.uri).resize({ width: STORED_WIDTH }).renderAsync();
      const saved = await rendered.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
      const eyes = await detectEyes(saved.uri);
      setShot({ uri: saved.uri, width: saved.width, height: saved.height, eyes });
    } catch (e) {
      Alert.alert('Impossible de prendre la photo', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!shot) return;
    setBusy(true);
    try {
      await uploadSelfie({ userId, day: dayKey(), ...shot });
      router.back();
    } catch (e) {
      Alert.alert("Échec de l'envoi", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (shot) {
    return (
      <SafeAreaView style={styles.dark}>
        <Image source={{ uri: shot.uri }} style={styles.preview} resizeMode="contain" />
        {!shot.eyes && (
          <Text style={styles.warning}>
            Yeux non détectés : la photo sera envoyée mais pas alignée dans le timelapse.
          </Text>
        )}
        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <Button title="Reprendre" variant="ghost" onPress={() => setShot(null)} disabled={busy} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Envoyer" onPress={send} loading={busy} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.dark}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="front"
        mirror
        onCameraReady={() => setCameraReady(true)}
        onMountError={(e) => Alert.alert('Caméra indisponible', e.message)}
      />
      {/* Guide: put your eyes on the line, like every other day. */}
      <View pointerEvents="none" style={styles.eyeLine} />
      <SafeAreaView style={styles.overlay}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Prendre la photo"
          onPress={takePicture}
          disabled={!cameraReady || busy}
          style={[styles.shutter, (!cameraReady || busy) && { opacity: 0.5 }]}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  dark: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  close: { color: '#fff', fontSize: 28, alignSelf: 'flex-start' },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 6, borderColor: '#fff', marginBottom: 20 },
  eyeLine: {
    position: 'absolute',
    top: '42%',
    left: '20%',
    right: '20%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
  },
  preview: { flex: 1 },
  warning: { color: '#FDBA74', textAlign: 'center', padding: 12 },
  actions: { flexDirection: 'row', gap: 12, padding: 20 },
});
