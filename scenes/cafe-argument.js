// Demo scene: two people at a cafe table, one leans in and points at ~2s.
// Scene contract: export build({ THREE, kit }) -> { scene, camera?, update?(t), name? }
//   camera: { pos:[x,y,z], target:[x,y,z], mm }   starting framing (metres, Y up)
//   update(t): called every frame with take time t in seconds (t = 0 when REC starts)
export const name = 'cafe-argument';

export function build({ THREE, kit }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d9cbb8');
  kit.lights(scene, { sun: [-3, 5, 4], sunIntensity: 1.6, ambient: 1.1 });

  const W = 9, Dp = 7, H = 3.2;
  scene.add(kit.room({ w: W, d: Dp, h: H, wall: '#f1ebe0', floor: '#b47c48', wainscot: '#2f5a3c', wainscotH: 1.15 }));

  // window on the left wall
  const win = kit.windowPanel({ w: 2.6, h: 1.5, sill: 1.0 });
  kit.at(win, -W / 2 + 0.03, 0, 0.5, 90); scene.add(win);
  // counter at the back
  scene.add(kit.box(3.6, 1.05, 0.7, '#5a2e1c', [1.5, 0, -Dp / 2 + 0.5]));
  scene.add(kit.box(3.6, 0.05, 0.75, '#2a1a12', [1.5, 1.05, -Dp / 2 + 0.5]));
  scene.add(kit.box(0.4, 0.45, 0.35, '#333', [0.6, 1.1, -Dp / 2 + 0.5]));   // espresso machine
  const pl = kit.plant(); kit.at(pl, -W / 2 + 0.5, 0, -Dp / 2 + 0.5); scene.add(pl);

  // hero table
  scene.add(kit.roundTable({ r: 0.45 }));
  const ca = kit.chair(); kit.at(ca, 0, 0, -0.62, 0); scene.add(ca);
  const cb = kit.chair(); kit.at(cb, 0, 0, 0.62, 180); scene.add(cb);
  const c1 = kit.cup(); kit.at(c1, 0.08, 0.77, -0.22); scene.add(c1);
  const c2 = kit.cup(); kit.at(c2, -0.1, 0.77, 0.22); scene.add(c2);

  // background tables for depth
  for (const [x, z] of [[-2.6, -1.8], [2.6, 1.6], [-2.4, 2.2]]) {
    const t = kit.roundTable({ r: 0.4 }); kit.at(t, x, 0, z); scene.add(t);
    const ch = kit.chair(); kit.at(ch, x, 0, z - 0.58, 0); scene.add(ch);
    const ch2 = kit.chair(); kit.at(ch2, x + 0.58, 0, z, -90); scene.add(ch2);
  }
  for (const x of [-1.5, 1.5]) { const l = kit.pendantLamp({ ceilingH: H }); kit.at(l, x, 0, 0); scene.add(l); }
  const lh = kit.pendantLamp({ ceilingH: H, drop: 1.1 }); scene.add(lh);

  // actors: A (white) faces +Z toward the table, B (wood) faces -Z
  const A = kit.mannequin({ color: '#eeece6', name: 'A_white', pose: 'sitTable' }); kit.at(A, 0, 0, -0.62, 0); scene.add(A);
  const B = kit.mannequin({ color: '#c99561', name: 'B_wood', pose: 'sitTable' }); kit.at(B, 0, 0, 0.62, 180); scene.add(B);

  const sitPoint = { ...kit.POSES.sitTable, spine: [16, 0, 0], armR: [-80, 0, -5], elbowR: [-5, 0, 0] };
  const sitHeadDown = { ...kit.POSES.sitTable, neck: [28, 0, 0], spine: [4, 0, 0] };

  function update(t) {
    kit.blendPose(B, 'sitTable', sitPoint, kit.ramp(t, 1.5, 2.2) - kit.ramp(t, 4.5, 5.3));
    kit.blendPose(A, 'sitTable', sitHeadDown, kit.ramp(t, 2.0, 2.8));
  }

  return { scene, update, camera: { pos: [1.6, 1.35, 2.2], target: [0, 0.95, 0], mm: 35 } };
}
