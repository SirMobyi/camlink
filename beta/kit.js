// camlink blocking kit: mannequins, furniture and rooms from primitives.
// Units are metres. Y is up. Characters and chairs face +Z by default.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// beta build: same API as ../kit.js, plus timeline markers

const D = Math.PI / 180;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...o });
const shadow = (o) => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
const mesh = (geo, color, o) => new THREE.Mesh(geo, color.isMaterial ? color : mat(color, o));

export function lights(scene, { sun = [4, 6, 3], sunColor = '#fff4e0', sunIntensity = 2.2, sky = '#dfe8ff', ground = '#6b5a48', ambient = 0.9 } = {}) {
  scene.add(new THREE.HemisphereLight(sky, ground, ambient));
  const d = new THREE.DirectionalLight(sunColor, sunIntensity);
  d.position.set(...sun);
  d.castShadow = true;
  d.shadow.mapSize.set(2048, 2048);
  const s = d.shadow.camera; s.left = s.bottom = -10; s.right = s.top = 10; s.near = 0.5; s.far = 40;
  d.shadow.bias = -0.0004; d.shadow.normalBias = 0.02;
  scene.add(d);
  return d;
}

// Interior box you stand inside. faces: +x, -x, ceiling, floor, +z, -z
export function room({ w = 8, d = 6, h = 3.2, wall = '#efe6d8', floor = '#b9824f', ceiling = '#f4efe6', walls = {}, wainscot = null, wainscotH = 1.1 } = {}) {
  const g = new THREE.Group(); g.name = 'room';
  const m = (c) => mat(c, { side: THREE.BackSide });
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [
    m(walls.px || wall), m(walls.nx || wall), m(ceiling), m(floor), m(walls.pz || wall), m(walls.nz || wall)]);
  box.position.y = h / 2; box.receiveShadow = true; g.add(box);
  if (wainscot) { // coloured lower band on all walls
    const t = 0.02;
    [[w, t, 0, -d / 2 + t / 2], [w, t, 0, d / 2 - t / 2]].forEach(([len, th, x, z]) => {
      const p = mesh(new THREE.BoxGeometry(len, wainscotH, th), wainscot); p.position.set(x, wainscotH / 2, z); g.add(p);
    });
    [[-w / 2 + t / 2], [w / 2 - t / 2]].forEach(([x]) => {
      const p = mesh(new THREE.BoxGeometry(t, wainscotH, d), wainscot); p.position.set(x, wainscotH / 2, 0); g.add(p);
    });
  }
  return shadow(g);
}

export function box(w, h, d, color = '#999', pos = [0, 0, 0]) {
  const b = mesh(new THREE.BoxGeometry(w, h, d), color); b.position.set(pos[0], pos[1] + h / 2, pos[2]); return shadow(b);
}

export function floorPlane(size = 40, color = '#8a8f87') {
  const p = mesh(new THREE.PlaneGeometry(size, size), color); p.rotation.x = -Math.PI / 2; p.receiveShadow = true; return p;
}

export function roundTable({ r = 0.45, h = 0.75, top = '#8a5a34', leg = '#222' } = {}) {
  const g = new THREE.Group(); g.name = 'table';
  const t = mesh(new THREE.CylinderGeometry(r, r, 0.04, 40), top); t.position.y = h; g.add(t);
  const p = mesh(new THREE.CylinderGeometry(0.035, 0.035, h, 12), leg); p.position.y = h / 2; g.add(p);
  const b = mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.03, 24), leg); b.position.y = 0.015; g.add(b);
  return shadow(g);
}

export function table({ w = 1.4, d = 0.8, h = 0.75, top = '#8a5a34', leg = '#3a2a1c' } = {}) {
  const g = new THREE.Group(); g.name = 'table';
  const t = mesh(new THREE.BoxGeometry(w, 0.04, d), top); t.position.y = h; g.add(t);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const l = mesh(new THREE.BoxGeometry(0.05, h, 0.05), leg); l.position.set(sx * (w / 2 - 0.06), h / 2, sz * (d / 2 - 0.06)); g.add(l);
  }
  return shadow(g);
}

// Chair faces +Z (backrest on -Z side). A seated mannequin at the same position/rotation fits it.
export function chair({ color = '#6b3f22', seatH = 0.46 } = {}) {
  const g = new THREE.Group(); g.name = 'chair';
  const s = mesh(new THREE.BoxGeometry(0.44, 0.04, 0.44), color); s.position.y = seatH; g.add(s);
  const back = mesh(new THREE.BoxGeometry(0.44, 0.45, 0.04), color); back.position.set(0, seatH + 0.25, -0.2); g.add(back);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const l = mesh(new THREE.BoxGeometry(0.035, seatH, 0.035), color); l.position.set(sx * 0.19, seatH / 2, sz * 0.19); g.add(l);
  }
  return shadow(g);
}

export function cup({ color = '#f4f1ea' } = {}) {
  const g = new THREE.Group(); g.name = 'cup';
  const c = mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.08, 20), color); c.position.y = 0.04; g.add(c);
  const s = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.008, 24), color); s.position.y = 0.004; g.add(s);
  return shadow(g);
}

export function pendantLamp({ drop = 0.9, ceilingH = 3.2, color = '#1f3b2c', light = '#ffd9a0', intensity = 6 } = {}) {
  const g = new THREE.Group(); g.name = 'lamp';
  const cord = mesh(new THREE.CylinderGeometry(0.006, 0.006, drop, 6), '#111'); cord.position.y = ceilingH - drop / 2; g.add(cord);
  const shade = mesh(new THREE.ConeGeometry(0.22, 0.2, 32, 1, true), mat(color, { side: THREE.DoubleSide }));
  shade.position.y = ceilingH - drop - 0.1; g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: light }));
  bulb.position.y = ceilingH - drop - 0.17; g.add(bulb);
  const pl = new THREE.PointLight(light, intensity, 7, 1.6); pl.position.copy(bulb.position); g.add(pl);
  return g;
}

// Glowing window panel to place on a wall (faces +Z; rotate as needed)
export function windowPanel({ w = 2, h = 1.6, sill = 0.9, glow = '#fffaf0', frame = '#ffffff' } = {}) {
  const g = new THREE.Group(); g.name = 'window';
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: glow }));
  p.position.y = sill + h / 2; g.add(p);
  const t = 0.05;
  [[w + t, t, 0, sill + h + t / 2], [w + t, t, 0, sill - t / 2], [t, h, -w / 2, sill + h / 2], [t, h, w / 2, sill + h / 2], [t, h, 0, sill + h / 2]]
    .forEach(([bw, bh, x, y]) => { const f = mesh(new THREE.BoxGeometry(bw, bh, 0.04), frame); f.position.set(x, y, 0.01); g.add(f); });
  return g;
}

export function plant({ h = 1.2, pot = '#c9b8a0', leaf = '#3f6b3a' } = {}) {
  const g = new THREE.Group(); g.name = 'plant';
  const p = mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.35, 20), pot); p.position.y = 0.175; g.add(p);
  for (let i = 0; i < 5; i++) {
    const s = mesh(new THREE.IcosahedronGeometry(0.22 + (i % 2) * 0.06, 0), leaf);
    s.position.set(Math.sin(i * 1.3) * 0.12, 0.45 + (h - 0.45) * (i / 5), Math.cos(i * 1.7) * 0.12); g.add(s);
  }
  return shadow(g);
}

// ---------------- Mannequin ----------------
// Wooden artist mannequin with a nose so facing direction reads on camera.
// Joints: hips, spine, neck, armL/armR (shoulders), elbowL/elbowR, legL/legR (hips), kneeL/kneeR.
// Positive rotation.x on arm/leg joints swings the limb backward, negative swings it forward.
export function mannequin({ color = '#d9b38c', joint = null, height = 1.75, pose = 'stand', name = 'actor' } = {}) {
  const s = height / 1.75;
  const jc = joint || new THREE.Color(color).multiplyScalar(0.8);
  const M = mat(color, { roughness: 0.55 }), J = mat(jc, { roughness: 0.55 });
  const root = new THREE.Group(); root.name = name;
  const j = {};
  const pivot = (parent, key, x, y, z) => { const p = new THREE.Group(); p.position.set(x, y, z); p.name = key; parent.add(p); j[key] = p; return p; };
  const limb = (parent, len, r) => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, len - 2 * r, 6, 12), M); c.position.y = -len / 2; parent.add(c); };
  const ball = (parent, r, y = 0) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), J); b.position.y = y; parent.add(b); };

  const hips = pivot(root, 'hips', 0, 0.95, 0);
  const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.12, 6, 12), M); pelvis.rotation.z = Math.PI / 2; hips.add(pelvis);
  const spine = pivot(hips, 'spine', 0, 0.06, 0);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.26, 6, 16), M); torso.position.y = 0.26; torso.scale.set(1.15, 1, 0.75); spine.add(torso);
  const neck = pivot(spine, 'neck', 0, 0.52, 0);
  const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.08, 10), J); nk.position.y = 0.04; neck.add(nk);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 18), M); head.scale.set(0.9, 1.15, 1); head.position.y = 0.18; neck.add(head);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 10), J); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.17, 0.11); neck.add(nose);

  for (const [side, sx] of [['L', 1], ['R', -1]]) {
    const sh = pivot(spine, 'arm' + side, sx * 0.2, 0.46, 0); ball(sh, 0.05); limb(sh, 0.3, 0.042);
    const el = pivot(sh, 'elbow' + side, 0, -0.3, 0); ball(el, 0.038); limb(el, 0.27, 0.036);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), J); hand.scale.set(0.8, 1.2, 0.5); hand.position.y = -0.3; el.add(hand);
    const hp = pivot(hips, 'leg' + side, sx * 0.1, -0.05, 0); ball(hp, 0.06); limb(hp, 0.44, 0.06);
    const kn = pivot(hp, 'knee' + side, 0, -0.44, 0); ball(kn, 0.05); limb(kn, 0.42, 0.05);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.2), J); foot.position.set(0, -0.43, 0.05); kn.add(foot);
  }
  root.scale.setScalar(s);
  root.userData.j = j;
  root.userData.base = height;
  setPose(root, pose);
  return shadow(root);
}

const POSES = {
  stand: { armL: [0, 0, 6], armR: [0, 0, -6], elbowL: [-8, 0, 0], elbowR: [-8, 0, 0] },
  sit: { hips: { y: 0.54 }, legL: [-90, 0, 4], legR: [-90, 0, -4], kneeL: [90, 0, 0], kneeR: [90, 0, 0], armL: [-20, 0, 6], armR: [-20, 0, -6], elbowL: [-50, 0, 0], elbowR: [-50, 0, 0] },
  sitTable: { hips: { y: 0.54 }, spine: [8, 0, 0], legL: [-90, 0, 4], legR: [-90, 0, -4], kneeL: [90, 0, 0], kneeR: [90, 0, 0], armL: [-45, 0, 10], armR: [-45, 0, -10], elbowL: [-55, 0, -10], elbowR: [-55, 0, 10] },
  point: { armL: [0, 0, 6], armR: [-85, 0, 0], elbowL: [-8, 0, 0], elbowR: [-4, 0, 0] },
  armsCrossed: { armL: [-30, -20, 20], armR: [-30, 20, -20], elbowL: [-100, 0, -40], elbowR: [-100, 0, 40] },
  handsUp: { armL: [-170, 0, 15], armR: [-170, 0, -15], elbowL: [-10, 0, 0], elbowR: [-10, 0, 0] },
  phone: { armL: [0, 0, 6], armR: [-40, 0, -10], elbowR: [-100, 0, 20], neck: [20, 0, 0] },
  carry: { armL: [-35, 0, 8], armR: [-35, 0, -8], elbowL: [-55, 0, -25], elbowR: [-55, 0, 25] },
  offer: { armL: [-65, 0, 6], armR: [-65, 0, -6], elbowL: [-20, 0, 0], elbowR: [-20, 0, 0] },
  wave: { armL: [0, 0, 6], armR: [-160, 0, -20], elbowR: [-30, 0, 0] },
  lookDown: { neck: [30, 0, 0], armL: [0, 0, 6], armR: [0, 0, -6] },
};

// pose: name from POSES or an object { joint: [xDeg, yDeg, zDeg], hips: { y } }. Unlisted joints reset.
export function setPose(m, pose = 'stand') {
  const p = typeof pose === 'string' ? POSES[pose] || POSES.stand : pose;
  const j = m.userData.j;
  for (const k in j) j[k].rotation.set(0, 0, 0);
  j.hips.position.y = 0.95;
  for (const k in p) {
    if (k === 'hips' && !Array.isArray(p.hips)) { j.hips.position.y = p.hips.y ?? 0.95; if (p.hips.r) j.hips.rotation.set(...p.hips.r.map(v => v * D)); continue; }
    if (j[k]) j[k].rotation.set(p[k][0] * D, p[k][1] * D, p[k][2] * D);
  }
}

// Blend between two pose objects/names by a (0..1). Useful inside update(t).
export function blendPose(m, a, b, k) {
  const A = typeof a === 'string' ? POSES[a] : a, B = typeof b === 'string' ? POSES[b] : b;
  const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
  const out = {};
  for (const key of keys) {
    if (key === 'hips') { out.hips = { y: THREE.MathUtils.lerp(A.hips?.y ?? 0.95, B.hips?.y ?? 0.95, k) }; continue; }
    const x = A[key] || [0, 0, 0], y = B[key] || [0, 0, 0];
    out[key] = x.map((v, i) => THREE.MathUtils.lerp(v, y[i], k));
  }
  setPose(m, out);
}

// Simple procedural walk; call every frame with scene time t (seconds).
export function walkCycle(m, t, { speed = 1.0 } = {}) {
  const ph = t * speed * 5.5, sw = Math.sin(ph) * 28, kn = Math.max(0, -Math.cos(ph)) * 45, kn2 = Math.max(0, Math.cos(ph)) * 45;
  setPose(m, { legL: [-sw, 0, 2], legR: [sw, 0, -2], kneeL: [kn, 0, 0], kneeR: [kn2, 0, 0], armL: [sw * 0.8, 0, 6], armR: [-sw * 0.8, 0, -6], elbowL: [-15, 0, 0], elbowR: [-15, 0, 0] });
  m.userData.j.hips.position.y = 0.95 + Math.abs(Math.cos(ph)) * 0.025;
}

// Turn a character (root group) to face a world point on the ground plane.
export function face(m, target) {
  const t = target.isVector3 ? target : new THREE.Vector3(...target);
  m.rotation.y = Math.atan2(t.x - m.position.x, t.z - m.position.z);
}

// Smooth 0..1 ramp between t0 and t1 (for timing beats in update)
export const ramp = (t, t0, t1) => { const x = THREE.MathUtils.clamp((t - t0) / (t1 - t0), 0, 1); return x * x * (3 - 2 * x); };

export const at = (o, x, y, z, rotYDeg = 0) => { o.position.set(x, y, z); o.rotation.y = rotYDeg * D; return o; };

// ---------------- more props ----------------
// Car faces +Z (front at +Z). ~4.2 m long.
export function car({ color = '#7a8fa6', glass = '#2b3440' } = {}) {
  const g = new THREE.Group(); g.name = 'car';
  const body = mesh(new THREE.BoxGeometry(1.8, 0.7, 4.2), color); body.position.y = 0.6; g.add(body);
  const cab = mesh(new THREE.BoxGeometry(1.6, 0.6, 2.2), glass); cab.position.set(0, 1.25, -0.2); g.add(cab);
  for (const sx of [-1, 1]) for (const sz of [-1.35, 1.35]) {
    const w = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 20), '#151515'); w.rotation.z = Math.PI / 2; w.position.set(sx * 0.85, 0.34, sz); g.add(w);
  }
  for (const sx of [-0.6, 0.6]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.05), new THREE.MeshBasicMaterial({ color: '#fff6d8' })); l.position.set(sx, 0.75, 2.11); g.add(l);
  }
  return shadow(g);
}

// Door in a frame. Hinge on the left (-X) edge; swing it with tl.rotate(door.userData.leaf, ...) or door.userData.leaf.rotation.y.
export function door({ w = 0.9, h = 2.1, color = '#6b4a32', frame = '#e9e2d6' } = {}) {
  const g = new THREE.Group(); g.name = 'door';
  const leaf = new THREE.Group(); leaf.position.set(-w / 2, 0, 0); g.add(leaf);
  const panel = mesh(new THREE.BoxGeometry(w, h, 0.05), color); panel.position.set(w / 2, h / 2, 0); leaf.add(panel);
  const knob = mesh(new THREE.SphereGeometry(0.03, 10, 8), '#c9a646'); knob.position.set(w - 0.08, 1.0, 0.05); leaf.add(knob);
  for (const [bw, bh, x, y] of [[0.08, h + 0.08, -w / 2 - 0.04, h / 2], [0.08, h + 0.08, w / 2 + 0.04, h / 2], [w + 0.16, 0.08, 0, h + 0.04]]) {
    const f = mesh(new THREE.BoxGeometry(bw, bh, 0.12), frame); f.position.set(x, y, 0); g.add(f);
  }
  g.userData.leaf = leaf;
  return shadow(g);
}

export function crate({ s = 0.4, color = '#b08a5a' } = {}) { return box(s, s, s, color); }

export function bench({ w = 1.6, color = '#5b4636' } = {}) {
  const g = new THREE.Group(); g.name = 'bench';
  const seat = mesh(new THREE.BoxGeometry(w, 0.06, 0.42), color); seat.position.y = 0.45; g.add(seat);
  const back = mesh(new THREE.BoxGeometry(w, 0.4, 0.05), color); back.position.set(0, 0.7, -0.19); g.add(back);
  for (const sx of [-1, 1]) { const l = mesh(new THREE.BoxGeometry(0.06, 0.45, 0.4), '#2a2a2a'); l.position.set(sx * (w / 2 - 0.1), 0.225, 0); g.add(l); }
  return shadow(g);
}

// ---------------- models ----------------
// Files the user drags onto the viewer are registered here by file name (blob URLs).
export const files = {};
// Load a .glb/.gltf: a dropped file by name ('set.glb') or a URL. Blender's glTF export is +Y up, metres.
export async function loadGLB(nameOrUrl, { scale = 1, shadows = true } = {}) {
  const url = files[nameOrUrl] || nameOrUrl;
  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene;
  root.scale.setScalar(scale);
  if (shadows) shadow(root);
  root.userData.animations = gltf.animations;
  return root;
}

// ---------------- timeline: subject and object motion ----------------
// const tl = kit.timeline();
// tl.walk(A, [[0,0,4],[0,0,1]], { start: 0.5, speed: 1.3, endFace: [0,0,0] });
// tl.poses(A, [{ t: 0, pose: 'stand' }, { t: 3, pose: 'point', blend: 0.4 }]);
// tl.move(carObj, [{ t: 2, pos: [0,0,-8] }, { t: 5, pos: [0,0,10] }]);      // also rotY (deg), scale
// tl.rotate(door.userData.leaf, [{ t: 1, y: 0 }, { t: 1.6, y: -80 }]);        // degrees, any of x/y/z
// tl.attach(cup, A, { at: 2.5, joint: 'elbowR', offset: [0, -0.3, 0.05] });   // prop follows a hand from t=2.5
// tl.look(B, A, { from: 2 });                                                 // B keeps turning to face A
// tl.call((t) => { ... });                                                    // anything custom
// return { scene, update: tl.update };
export function timeline() {
  const poseTracks = [], moveTracks = [], walkTracks = [], afterTracks = [], marks = new Set();
  const mark = (t) => { if (Number.isFinite(t) && t > 0.05) marks.add(Math.round(t * 10) / 10); };
  const smooth = (x) => x * x * (3 - 2 * x);
  const seg = (keys, t) => {
    if (t <= keys[0].t) return [keys[0], keys[0], 0];
    const last = keys[keys.length - 1];
    if (t >= last.t) return [last, last, 0];
    let i = 0; while (keys[i + 1].t < t) i++;
    const a = keys[i], b = keys[i + 1];
    return [a, b, (t - a.t) / (b.t - a.t)];
  };
  const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const sorted = (keys) => [...keys].sort((x, y) => x.t - y.t);

  const tl = {
    poses(m, beats) {
      const keys = sorted(beats);
      keys.forEach((k) => mark(k.t));
      m.userData.hasPoseTrack = true;
      poseTracks.push((t) => {
        let i = 0; while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
        const cur = keys[i], next = keys[i + 1];
        if (!next) return setPose(m, cur.pose);
        const bl = next.blend ?? 0.4;
        const k = bl > 0 ? smooth(THREE.MathUtils.clamp((t - (next.t - bl)) / bl, 0, 1)) : (t >= next.t ? 1 : 0);
        if (t < keys[0].t) return setPose(m, keys[0].pose);
        blendPose(m, cur.pose, next.pose, k);
      });
      return tl;
    },
    move(obj, keys, { ease = true } = {}) {
      const ks = sorted(keys);
      ks.forEach((k) => mark(k.t));
      obj.userData._moved = true;
      const p0 = obj.position.toArray(), r0 = obj.rotation.y / D, s0 = obj.scale.x;
      let lp = p0, lr = r0, ls = s0;
      for (const k of ks) { k.pos = k.pos || lp; k.rotY = k.rotY ?? lr; k.scale = k.scale ?? ls; lp = k.pos; lr = k.rotY; ls = k.scale; }
      moveTracks.push((t) => {
        const [a, b, f] = seg(ks, t), k = ease ? smooth(f) : f;
        obj.position.fromArray(lerp3(a.pos, b.pos, k));
        obj.rotation.y = (a.rotY + (b.rotY - a.rotY) * k) * D;
        obj.scale.setScalar(a.scale + (b.scale - a.scale) * k);
      });
      return tl;
    },
    rotate(obj, keys) {
      const ks = sorted(keys);
      ks.forEach((k) => mark(k.t));
      moveTracks.push((t) => {
        const [a, b, f] = seg(ks, t), k = smooth(f);
        for (const ax of ['x', 'y', 'z']) if (a[ax] !== undefined && b[ax] !== undefined) obj.rotation[ax] = (a[ax] + (b[ax] - a[ax]) * k) * D;
      });
      return tl;
    },
    walk(m, points, { start = 0, speed = 1.3, endFace = null, endPose = null } = {}) {
      const pts = points.map((p) => new THREE.Vector3(p[0], p[1] ?? 0, p[2]));
      const lens = []; let total = 0;
      for (let i = 0; i < pts.length - 1; i++) { const l = pts[i].distanceTo(pts[i + 1]); lens.push(l); total += l; }
      const end = start + total / speed;
      mark(start); mark(end);
      walkTracks.push({ m, start, end, fn: (t) => {
        let d = THREE.MathUtils.clamp((t - start) * speed, 0, total), i = 0;
        while (i < lens.length - 1 && d > lens[i]) { d -= lens[i]; i++; }
        const a = pts[i], b = pts[i + 1] || pts[i], k = lens[i] ? Math.min(d / lens[i], 1) : 0;
        m.position.lerpVectors(a, b, k);
        const walking = t > start && t < end;
        if (t <= start) m.rotation.y = Math.atan2(pts[1 % pts.length].x - pts[0].x, pts[1 % pts.length].z - pts[0].z);
        else if (walking) m.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
        else if (endFace) face(m, endFace);
        if (walking) walkCycle(m, t - start, { speed: speed / 1.3 });
        else if (!m.userData.hasPoseTrack) setPose(m, (t >= end && endPose) || 'stand');
      } });
      return tl;
    },
    attach(obj, m, { at = 0, joint = 'elbowR', offset = [0, -0.3, 0.05], until = Infinity } = {}) {
      const home = obj.position.clone(), homeRot = obj.rotation.clone(), v = new THREE.Vector3();
      const first = !obj.userData._attached; obj.userData._attached = true;
      mark(at); mark(until);
      afterTracks.push((t) => {
        if (t >= at && t < until) {
          const j = m.userData.j?.[joint] || m;
          m.updateMatrixWorld(true);
          v.set(...offset).applyMatrix4(j.matrixWorld);
          if (obj.parent) obj.parent.worldToLocal(v);
          obj.position.copy(v);
        } else if (t < at && first && !obj.userData._moved) { obj.position.copy(home); obj.rotation.copy(homeRot); }
      });
      return tl;
    },
    look(m, target, { from = 0, until = Infinity } = {}) {
      afterTracks.push((t) => { if (t >= from && t < until) face(m, target.isObject3D ? target.position : target); });
      return tl;
    },
    call(fn) { afterTracks.push(fn); return tl; },
    duration() {
      let d = 0;
      for (const w of walkTracks) d = Math.max(d, w.end);
      return d;
    },
    update(t) {
      for (const f of poseTracks) f(t);
      for (const f of moveTracks) f(t);
      for (const w of walkTracks) w.fn(t);
      for (const f of afterTracks) f(t);
    },
  };
  tl.update = tl.update.bind(tl);
  // Beat times for the viewer's timeline (seconds)
  tl.update.markers = () => [...marks].sort((a, b) => a - b);
  tl.markers = tl.update.markers;
  return tl;
}

export { THREE, POSES };
