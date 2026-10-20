import FaceDetection from '@react-native-ml-kit/face-detection';

import { normalizeEyes, type Eyes } from './alignment';

/**
 * Detects the eyes of the most prominent face in a local image, on device
 * (Google ML Kit on both iOS and Android). Returns null if no face is found.
 */
export async function detectEyes(imageUri: string): Promise<Eyes | null> {
  let faces;
  try {
    faces = await FaceDetection.detect(imageUri, {
      performanceMode: 'accurate',
      landmarkMode: 'all',
      minFaceSize: 0.2,
    });
  } catch (e) {
    // A detection failure must never block the daily selfie: it is just not aligned.
    console.warn('Face detection failed', e);
    return null;
  }

  const face = faces
    .filter((f) => f.landmarks?.leftEye && f.landmarks?.rightEye)
    .sort((a, b) => b.frame.width * b.frame.height - a.frame.width * a.frame.height)[0];
  if (!face?.landmarks) return null;

  return normalizeEyes(face.landmarks.leftEye.position, face.landmarks.rightEye.position);
}
