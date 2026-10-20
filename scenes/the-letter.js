// Auto camera demo: B walks in with news, A hands over a letter, B reads it and reacts, A turns back to the window.
// The shot list at the bottom is what Auto mode plays: eight shots with moves, cuts, lenses and one whip pan.
// Every camera sits on the same side of the A-B line (coverage side -1), so screen direction holds across cuts.
export const name = 'the-letter';
export const duration = 11;

export function build({ THREE, kit }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d8d2c6');
  kit.lights(scene, { sun: [-6, 5, 2], sunIntensity: 1.8, ambient: 1.05 });

  // set: a 7 x 6 m room. Window on the -X wall, a real doorway in the back wall (z = -3) with a hall behind it
  const W = 7, H = 3, wall = '#ece5d8';
  scene.add(kit.room({ w: W, d: 7, h: H, wall, floor: '#a9794c', wainscot: '#4d5b52', wainscotH: 1.0 }));   // back of the room box is the hall
  for (const [x0, x1, y0, y1] of [[-3.5, -1.05, 0, H], [-0.15, 3.5, 0, H], [-1.05, -0.15, 2.1, H]]) {
    scene.add(kit.box(x1 - x0, y1 - y0, 0.1, wall, [(x0 + x1) / 2, y0, -3.05]));
    if (y0 === 0) scene.add(kit.box(x1 - x0, 1.0, 0.02, '#4d5b52', [(x0 + x1) / 2, 0, -2.99]));
  }
  const win = kit.windowPanel({ w: 2.2, h: 1.6, sill: 0.9, glow: '#fff6e2' }); kit.at(win, -W / 2 + 0.03, 0, 0.3, 90); scene.add(win);
  const door = kit.door({ w: 0.9, color: '#5b4231' }); kit.at(door, -0.6, 0, -3.0, 0); scene.add(door);
  const table = kit.table({ w: 1.4, d: 0.8 }); kit.at(table, 1.5, 0, 1.6); scene.add(table);
  for (const [x, z, r] of [[1.0, 2.25, 180], [2.0, 2.25, 180], [1.5, 0.95, 0]]) { const c = kit.chair(); kit.at(c, x, 0, z, r); scene.add(c); }
  scene.add(kit.box(1.4, 0.9, 0.45, '#7a6553', [2.2, 0, -2.75]));
  const pl = kit.plant({ h: 1.4 }); kit.at(pl, -W / 2 + 0.45, 0, -1.6); scene.add(pl);
  const lamp = kit.pendantLamp({ ceilingH: H, drop: 0.8 }); kit.at(lamp, 1.5, 0, 1.6); scene.add(lamp);

  // cast: A (white) reads at the window, B (blue) comes in through the door
  const A = kit.mannequin({ color: '#eeece6', name: 'A_white' }); kit.at(A, -2.2, 0, 0.3, -90); scene.add(A);
  const B = kit.mannequin({ color: '#4f6d8f', name: 'B_blue' }); scene.add(B);
  const letter = kit.box(0.21, 0.29, 0.006, '#fbfaf5'); scene.add(letter);

  const tl = kit.timeline()
    .rotate(door.userData.leaf, [{ t: 0.4, y: 0 }, { t: 1.0, y: -85 }])
    .walk(B, [[-0.6, 0, -3.35], [-0.6, 0, -2.2], [-1.4, 0, -0.25]], { start: 0.9, speed: 1.3, endFace: [-2.2, 1.6, 0.3] })
    .poses(B, [{ t: 0, pose: 'stand' }, { t: 4.6, pose: 'offer', blend: 0.4 }, { t: 5.5, pose: 'read', blend: 0.4 }, { t: 7.6, pose: 'shock', blend: 0.25 }, { t: 9.6, pose: 'lookDown', blend: 0.7 }])
    // A turns from the window to B (the short way round), then back to the window
    .move(A, [{ t: 2.7, rotY: -90 }, { t: 3.4, rotY: -235.5 }, { t: 8.6, rotY: -235.5 }, { t: 9.5, rotY: -90 }])
    .poses(A, [{ t: 0, pose: 'read' }, { t: 4.0, pose: 'offer', blend: 0.5 }, { t: 5.4, pose: 'stand', blend: 0.4 }, { t: 6.2, pose: 'armsCrossed', blend: 0.6 }])
    // the hand-off: A's hand, across, B's hand
    .attach(letter, A, { at: 0, until: 4.9, offset: [0.06, -0.31, 0.06] })
    .move(letter, [{ t: 4.9, pos: [-1.95, 1.12, 0.12] }, { t: 5.2, pos: [-1.7, 1.15, -0.02] }])
    .attach(letter, B, { at: 5.2, offset: [0.06, -0.31, 0.06] })
    .call((t) => { const who = t < 4.9 ? A : t >= 5.2 ? B : null; if (who) letter.rotation.set(-0.45, who.rotation.y + Math.PI, 0, 'YXZ'); });

  // ---- shot list (Auto mode) ----
  // Functions run at the shot's time with the action already posed, so they can frame people where they are.
  const cov = () => kit.coverage(A, B, { side: -1 });
  const shots = kit.shots([
    { t: 0, name: 'Establishing', cam: { pos: [2.6, 2.3, 2.6], target: [-1.3, 1.0, -0.9], mm: 22 }, move: 'push', amount: 0.35, shake: 0.15,
      desc: 'Wide, high from the corner: A reads by the window, the door opens and B walks in' },
    { t: 2.0, name: 'B walks in', cam: () => kit.frame(B, { size: 'MWS', toward: [0.6, 1.5, 1.4] }), live: true, shake: 0.3,
      desc: 'Medium shot tracking B across the room toward A' },
    { t: 3.0, name: 'A turns', cam: () => cov().cuA, live: true, shake: 0.2,
      desc: 'Close-up on A turning from the window to face B' },
    { t: 3.9, name: 'Two-shot', cam: () => cov().two, move: 'push', amount: 0.25,
      desc: 'Two-shot in profile: A holds out the letter' },
    { t: 4.8, name: 'Insert letter', cam: () => cov().insert(letter, 'MCU'), live: true,
      desc: 'Insert, high angle: the letter passes from A to B' },
    { t: 5.6, name: 'B reads', cam: () => kit.coverage(A, B, { side: -1, size: 'MS' }).otsA, live: true, move: 'push', amount: 0.3, shake: 0.2,
      desc: 'Over A\'s shoulder onto B reading, slow push in' },
    { t: 7.4, name: 'Reaction', cam: () => cov().cuB, move: 'push', amount: 0.5, shake: 0.25,
      desc: 'Close-up on B as the news lands' },
    { t: 8.8, name: 'Back to window', cam: () => kit.frame(A, { size: 'MWS', yaw: 160 }), live: true, transition: 'whip', shake: 0.15,
      desc: 'Whip pan to A from behind, turning back to the bright window' },
  ]);

  return { scene, update: tl.update, shots, camera: { pos: [2.6, 2.3, 2.6], target: [-1.3, 1.0, -0.9], mm: 22 } };
}
