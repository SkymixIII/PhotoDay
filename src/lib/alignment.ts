// Pure geometry used to build the eye-aligned timelapse.
// Every selfie is mapped onto a fixed canvas so that both eyes land on the
// same target points, whatever the head position, distance or tilt.

export type Point = { x: number; y: number };

/** Eyes as seen in the image: `left` is the eye with the smaller x. */
export type Eyes = { left: Point; right: Point };

export type CanvasSpec = {
  width: number;
  height: number;
  /** Target eye positions, as fractions of the canvas size. */
  leftEye: Point;
  rightEye: Point;
};

export const DEFAULT_CANVAS: CanvasSpec = {
  width: 1080,
  height: 1440,
  leftEye: { x: 0.36, y: 0.42 },
  rightEye: { x: 0.64, y: 0.42 },
};

/**
 * Similarity transform p' = R(rotation) * scale * p + translate,
 * expressed in image pixels -> canvas pixels, with origin at top-left.
 */
export type Similarity = {
  scale: number;
  rotation: number; // radians
  translateX: number;
  translateY: number;
};

/** Orders two detected eye points by their x coordinate in the image. */
export function normalizeEyes(a: Point, b: Point): Eyes {
  return a.x <= b.x ? { left: a, right: b } : { left: b, right: a };
}

export function targetEyes(canvas: CanvasSpec): Eyes {
  return {
    left: { x: canvas.leftEye.x * canvas.width, y: canvas.leftEye.y * canvas.height },
    right: { x: canvas.rightEye.x * canvas.width, y: canvas.rightEye.y * canvas.height },
  };
}

export function computeAlignment(eyes: Eyes, canvas: CanvasSpec = DEFAULT_CANVAS): Similarity {
  const target = targetEyes(canvas);
  const src = { x: eyes.right.x - eyes.left.x, y: eyes.right.y - eyes.left.y };
  const dst = { x: target.right.x - target.left.x, y: target.right.y - target.left.y };
  const srcLen = Math.hypot(src.x, src.y);
  if (srcLen === 0) throw new Error('Both eyes are at the same position');

  const scale = Math.hypot(dst.x, dst.y) / srcLen;
  const rotation = Math.atan2(dst.y, dst.x) - Math.atan2(src.y, src.x);
  const moved = rotateScale(eyes.left, rotation, scale);
  return {
    scale,
    rotation,
    translateX: target.left.x - moved.x,
    translateY: target.left.y - moved.y,
  };
}

export function applySimilarity(t: Similarity, p: Point): Point {
  const q = rotateScale(p, t.rotation, t.scale);
  return { x: q.x + t.translateX, y: q.y + t.translateY };
}

/**
 * React Native transforms rotate and scale around the element's center.
 * Returns the style transform for an <Image> of size imageWidth x imageHeight
 * positioned at (0, 0) inside the canvas, equivalent to `t`.
 */
export function toCenteredTransform(t: Similarity, imageWidth: number, imageHeight: number) {
  const c = { x: imageWidth / 2, y: imageHeight / 2 };
  const mappedCenter = applySimilarity(t, c);
  return [
    { translateX: mappedCenter.x - c.x },
    { translateY: mappedCenter.y - c.y },
    { rotate: `${t.rotation}rad` },
    { scale: t.scale },
  ];
}

function rotateScale(p: Point, rotation: number, scale: number): Point {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return { x: scale * (cos * p.x - sin * p.y), y: scale * (sin * p.x + cos * p.y) };
}
