// Motion demo: a car pulls up, the waiting woman stands, carries a parcel over and loads it, the car drives off.
// A passer-by crosses on the pavement behind. Everything runs on kit.timeline().
export const name = 'street-pickup';
export const duration = 11;

export function build({ THREE, kit }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bcd0dc');
  scene.fog = new THREE.Fog('#bcd0dc', 25, 60);
  kit.lights(scene, { sun: [6, 9, 5], sunIntensity: 2.4, ambient: 1.0 });

  // street: road along X, raised pavement on -Z side, shopfronts behind
  scene.add(kit.floorPlane(80, '#4a4d52'));
  scene.add(kit.box(80, 0.15, 4, '#a7a29a', [0, 0, -4]));
  for (let x = -30; x <= 30; x += 3) scene.add(kit.box(1.4, 0.01, 0.15, '#e8e4d8', [x, 0, 0.6]));   // lane dashes
  const fronts = ['#c9b79c', '#8fa3a0', '#b98b73', '#d4cdbd', '#9c8f86', '#c4a98a'];
  fronts.forEach((c, i) => {
    const x = -15 + i * 6;
    scene.add(kit.box(5.8, 7 + (i % 3), 1, c, [x, 0, -6.5]));
    const w = kit.windowPanel({ w: 2.2, h: 1.4, sill: 0.9, glow: '#dfe9ee' }); kit.at(w, x - 1, 0.15, -5.98); scene.add(w);
    const d = kit.door({ w: 1, color: '#3e4a52' }); kit.at(d, x + 1.6, 0.15, -5.97); scene.add(d);
  });
  for (const x of [-6, 6]) { scene.add(kit.box(0.12, 4, 0.12, '#2f3337', [x, 0.15, -2.4])); scene.add(kit.box(0.7, 0.12, 0.25, '#2f3337', [x + 0.3, 4.1, -2.4])); }
  const bench = kit.bench(); kit.at(bench, 1.2, 0.15, -3.2, 0); scene.add(bench);

  // cast
  const A = kit.mannequin({ color: '#eeece6', name: 'A_white' }); kit.at(A, 1.2, 0.15, -3.2, 0); scene.add(A);
  const B = kit.mannequin({ color: '#c99561', name: 'B_wood' }); kit.at(B, -9, 0.15, -4.6, 90); scene.add(B);
  const car = kit.car({ color: '#9d3b32' }); kit.at(car, -16, 0, -0.9, 90); scene.add(car);
  const parcel = kit.crate({ s: 0.38, color: '#c8a46e' }); scene.add(parcel);

  const tl = kit.timeline()
    // car pulls in and stops beside the bench, then leaves
    .move(car, [{ t: 0, pos: [-16, 0, -0.9] }, { t: 3.6, pos: [1.4, 0, -0.9] }, { t: 8.0, pos: [1.4, 0, -0.9] }, { t: 11, pos: [20, 0, -0.9] }])
    // A: seated holding the parcel, stands, walks to the car, hands it in
    .poses(A, [{ t: 0, pose: 'sit' }, { t: 2.6, pose: 'carry', blend: 0.6 }, { t: 6.0, pose: 'offer', blend: 0.5 }, { t: 7.2, pose: 'stand', blend: 0.4 }, { t: 8.6, pose: 'wave', blend: 0.4 }])
    .walk(A, [[1.2, 0.15, -3.2], [1.5, 0.15, -2.35]], { start: 3.6, speed: 0.9, endFace: [1.5, 0.15, 0] })
    .attach(parcel, A, { at: 0, until: 6.2, joint: 'elbowR', offset: [-0.12, -0.32, 0.12] })
    .move(parcel, [{ t: 6.2, pos: [1.5, 1.2, -1.9] }, { t: 6.9, pos: [1.6, 0.95, -1.3] }])
    .attach(parcel, car, { at: 6.9, joint: 'none', offset: [0.4, 0.95, 0.2] })
    // passer-by on the pavement behind, glancing at the car
    .walk(B, [[-9, 0.15, -4.6], [10, 0.15, -4.6]], { start: 0, speed: 1.25 })
    .poses(B, [{ t: 0, pose: 'stand' }]);

  return { scene, update: tl.update, camera: { pos: [4.6, 1.45, 1.8], target: [0.8, 1.0, -2.4], mm: 28 } };
}
