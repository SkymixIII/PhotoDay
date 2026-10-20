import { Image, StyleSheet, View } from 'react-native';

import { DEFAULT_CANVAS, computeAlignment, toCenteredTransform, type CanvasSpec } from '../lib/alignment';
import { selfieEyes, type SelfieWithUrl } from '../lib/api';

/**
 * Draws a selfie on a fixed-ratio canvas, moved, scaled and rotated so the
 * eyes sit on the canvas target points. Falls back to a centered crop when
 * no eyes were detected.
 */
export function AlignedFrame({ selfie, width, canvas = DEFAULT_CANVAS }: { selfie: SelfieWithUrl; width: number; canvas?: CanvasSpec }) {
  const height = (width * canvas.height) / canvas.width;
  const eyes = selfieEyes(selfie);

  if (!eyes) {
    return <Image source={{ uri: selfie.url }} style={{ width, height }} resizeMode="cover" />;
  }

  // Alignment is computed in canvas pixels, then scaled down to display size.
  const k = width / canvas.width;
  const t = computeAlignment(eyes, canvas);
  const transform = toCenteredTransform(
    { scale: t.scale * k, rotation: t.rotation, translateX: t.translateX * k, translateY: t.translateY * k },
    selfie.width,
    selfie.height,
  );

  return (
    <View style={[styles.canvas, { width, height }]}>
      <Image
        source={{ uri: selfie.url }}
        style={{ position: 'absolute', left: 0, top: 0, width: selfie.width, height: selfie.height, transform }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { overflow: 'hidden', backgroundColor: '#000' },
});
