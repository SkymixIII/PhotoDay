import {
  DEFAULT_CANVAS,
  applySimilarity,
  computeAlignment,
  normalizeEyes,
  targetEyes,
  toCenteredTransform,
  type Point,
} from './alignment';

function expectClose(a: Point, b: Point) {
  expect(a.x).toBeCloseTo(b.x, 6);
  expect(a.y).toBeCloseTo(b.y, 6);
}

/** Applies a React Native style transform list (around the element center). */
function applyCentered(transform: ReturnType<typeof toCenteredTransform>, w: number, h: number, p: Point): Point {
  const [tx, ty, rot, sc] = transform as [{ translateX: number }, { translateY: number }, { rotate: string }, { scale: number }];
  const r = parseFloat(rot.rotate);
  const c = { x: w / 2, y: h / 2 };
  const dx = (p.x - c.x) * sc.scale;
  const dy = (p.y - c.y) * sc.scale;
  return {
    x: c.x + tx.translateX + Math.cos(r) * dx - Math.sin(r) * dy,
    y: c.y + ty.translateY + Math.sin(r) * dx + Math.cos(r) * dy,
  };
}

describe('alignment', () => {
  const target = targetEyes(DEFAULT_CANVAS);

  it('orders eyes by x', () => {
    const eyes = normalizeEyes({ x: 600, y: 500 }, { x: 400, y: 510 });
    expect(eyes.left.x).toBe(400);
    expect(eyes.right.x).toBe(600);
  });

  it('maps both eyes onto the target points (tilted, off-center face)', () => {
    const eyes = normalizeEyes({ x: 300, y: 700 }, { x: 520, y: 640 });
    const t = computeAlignment(eyes);
    expectClose(applySimilarity(t, eyes.left), target.left);
    expectClose(applySimilarity(t, eyes.right), target.right);
  });

  it('is the identity when the eyes already sit on the targets', () => {
    const t = computeAlignment(target);
    expect(t.scale).toBeCloseTo(1);
    expect(t.rotation).toBeCloseTo(0);
    expect(t.translateX).toBeCloseTo(0);
    expect(t.translateY).toBeCloseTo(0);
  });

  it('produces an equivalent center-origin transform for React Native', () => {
    const eyes = normalizeEyes({ x: 410, y: 820 }, { x: 690, y: 860 });
    const t = computeAlignment(eyes);
    const rn = toCenteredTransform(t, 1080, 1920);
    expectClose(applyCentered(rn, 1080, 1920, eyes.left), target.left);
    expectClose(applyCentered(rn, 1080, 1920, eyes.right), target.right);
  });

  it('rejects degenerate input', () => {
    expect(() => computeAlignment({ left: { x: 1, y: 1 }, right: { x: 1, y: 1 } })).toThrow();
  });
});
