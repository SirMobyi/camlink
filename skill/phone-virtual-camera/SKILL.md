---
name: "phone-virtual-camera"
description: "Use when someone says \"use camlink\" or wants a 3D blocking scene they can shoot with their phone as a handheld virtual camera, with character and object motion, then hand the take to Seedance, Luma or Runway."
---

# camlink: phone as a virtual camera for blocking

camlink is a hosted web app: **https://sirmobyi.github.io/camlink/**

- The computer shows the 3D blocking scene. The phone scans a QR code and becomes the camera (gyro for tilt and pan, on-screen sticks for dolly, truck and pedestal, a lens slider). REC records the move.
- Nothing to install and no Terminal. It works in Chrome, Safari and the Claude app's browser pane. Phone and computer link peer to peer, on any network.
- Each take downloads a frame-exact **clean 24fps MP4** (rendered in the browser) plus, on demand, the realtime clip and the camera path JSON.
- **A scene lives inside its link** (`#scene=<compressed code>`), so every scene is a shareable URL. Demo scenes: `?scene=cafe-argument` (dialogue at a table) and `?scene=street-pickup` (car arrives, a parcel gets loaded, a passer-by crosses).

Your job: turn the user's description into a scene file, load it, check it, and hand over a link the user can shoot.

## Workflow

1. **Brief.** You need the location, the cast (who, rough look, where they start), the beats with timing (who moves where, what objects move), the duration, and optionally aspect ratio and lens feel. Ask one compact question only for what is missing. Defaults: 16:9, 35mm, 8 to 10 s.
2. **Write the scene** with the contract and kit below. Give each character a distinct mannequin colour and name them by colour (`A_white`, `B_wood`, `C_blue`), so the generation prompt can map colours to reference images.
3. **Load it.**
   - If the built-in browser is available (Claude desktop app): open `https://sirmobyi.github.io/camlink/` with `preview_start` (allow the site once if asked). Then run `await camlink.loadScene(<the scene code as a JSON string literal>)` with `javascript_tool`. It returns `{ok, name, link}` or `{ok:false, error}`. Fix any error and load again. The phone stays connected across reloads of the scene.
   - Otherwise build the link in code and give it to the user, and also send the scene as `<name>.js` (it can be dragged onto the page):
     ```python
     import zlib, base64
     c = zlib.compressobj(9, zlib.DEFLATED, -15)          # raw deflate
     raw = c.compress(code.encode()) + c.flush()
     link = "https://sirmobyi.github.io/camlink/#scene=" + base64.urlsafe_b64encode(raw).decode().rstrip("=")
     ```
4. **Check the beats** (built-in browser): `camlink.framing([x,y,z],[tx,ty,tz], mm)` sets a view, `camlink.seek(t)` freezes the action at t seconds, then take one screenshot per key beat (two or three, not more). Look for characters walking through furniture, props not in hands, people facing the wrong way. Fix and reload. `camlink.seek(null)` releases the freeze. Finish by calling `camlink.framing(...)` with the scene's opening framing.
5. **Hand over.** Give the scene link and the shooting steps:
   1. Scan the QR on the right with the phone camera, tap **Start**, allow motion.
   2. **P** plays the action to rehearse. Frame with the mouse, then tap **Recenter** on the phone: the phone takes over from that framing.
   3. Tap **REC** on the phone (or press R), perform the move, tap **STOP**. The clean MP4 downloads automatically. The action restarts at 0 s on every take.
6. **Iterate** on notes ("B should stand at 3 s", "car comes from the other side"): edit the code and load it again. Each load gives a new link. Mention that the old link still opens the old version.
7. **Generate** with the prompt template at the end, when asked.

## Scene contract

```js
export const name = 'kebab-case-name';     // used for take file names
export const duration = 10;                // preview loop length in seconds
export function build({ THREE, kit }) {    // may be async (await kit.loadGLB)
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c9d3da');
  kit.lights(scene, { sun: [5, 8, 4] });
  // ... set, props, cast
  const tl = kit.timeline() /* .walk(...).poses(...).move(...) */;
  return { scene, update: tl.update, camera: { pos: [x, y, z], target: [x, y, z], mm: 35 } };
}
```

Rules: no `import` statements (THREE and kit are passed in); metres, +Y up; characters, chairs, benches and cars face **+Z** at rotation 0 (`kit.at(obj, x, y, z, 180)` faces -Z, 90 faces +X). Keep it to primitives and flat colours: video models read silhouettes, eyelines, depth and motion, not textures. `update(t)` must be a pure function of t (no accumulation), because clean renders replay it frame by frame.

## Kit reference

**Set and props**
- `lights(scene, {sun:[x,y,z], sunIntensity=2.2, ambient=0.9, sky, ground})` once per scene.
- `room({w, d, h, wall, floor, ceiling, walls:{px,nx,pz,nz}, wainscot, wainscotH})`: interior box centred on the origin.
- `floorPlane(size, color)` for exteriors. `box(w, h, d, color, [x,y,z])` sits on the ground at its position (good for buildings, counters, kerbs, beds).
- `roundTable({r, h})`, `table({w, d, h})`, `chair({color, seatH})`, `bench({w})`, `cup()`, `crate({s})`, `plant({h})`, `pendantLamp({ceilingH, drop})`, `windowPanel({w, h, sill, glow})` (glowing, faces +Z), `door({w, h})` (hinge on its -X edge; swing `door.userData.leaf`), `car({color})` (about 4.2 m long, front at +Z).
- `at(obj, x, y, z, rotYDeg)` positions anything and returns it. `face(obj, [x,y,z])` turns it toward a point.
- `await loadGLB('name.glb' | url, {scale})`: the user's own model, dropped onto the page (by file name) or from a URL.

**Cast**
- `mannequin({color, height=1.75, pose, name})`: a wooden artist mannequin with a nose cone, so the facing reads on camera.
- Poses: `stand, sit, sitTable, point, armsCrossed, handsUp, phone, carry, offer, wave, lookDown`. Custom pose: `{ ...kit.POSES.sit, armR: [-80, 0, -5], neck: [20, 0, 0] }`. Joints: `hips` (`{y}`, standing 0.95, seated 0.54), `spine, neck, armL, armR, elbowL, elbowR, legL, legR, kneeL, kneeR` as `[xDeg, yDeg, zDeg]`. Negative x swings a limb forward (arm -90 points ahead), a negative elbow x bends the forearm up, and a positive knee x bends the knee back.
- A seated actor uses the same position and rotation as their chair, with pose `sit` or `sitTable`.

**Motion: `const tl = kit.timeline()`, chainable, then `update: tl.update`**
- `tl.walk(m, [[x,y,z], ...], {start, speed=1.3, endFace:[x,y,z], endPose})`: walks the path with a walk cycle and turns along each segment. Before `start` the actor stands at the first point.
- `tl.poses(m, [{t, pose, blend=0.4}, ...])`: pose beats (blend seconds into each one). The walk cycle overrides it while walking.
- `tl.move(obj, [{t, pos:[x,y,z], rotY, scale}, ...])`: eased keyframes for any object: cars, doors on rails, a falling box, a lift. Omitted fields hold their last value.
- `tl.rotate(obj, [{t, x, y, z}, ...])`: degrees. Door swing: `tl.rotate(door.userData.leaf, [{t:1, y:0}, {t:1.6, y:-85}])`.
- `tl.attach(prop, m, {at, until, joint='elbowR', offset:[x,y,z]})`: the prop follows a hand (or any object: pass a car as `m` and `joint: 'none'`) between `at` and `until`. A hand-off is `attach` to A until t, a short `move`, then `attach` to B from t.
- `tl.look(m, target, {from, until})`: keeps turning m toward a point or object.
- `tl.call((t) => { ... })` for anything else (lights flicker, a screen colour change).
- Timing: plan beats on paper first (t in seconds), keep the action inside `duration`, and leave about 1 s of settle at the start so the operator can find the frame.

## Handing the take to a video model

Use `<take>_clean.mp4`, trimmed to the generation length. Attach character and location references as images, tag them @Image 1, @Image 2 and so on, and tag the take as @Video 1. Keep the prompt under 2500 characters, don't re-describe what the references show, and give every moving element its own motion line.

```
@Video 1 is a grey-box 3D blocking pass. Match its camera movement, lens, framing, character
blocking and timing exactly, frame for frame. Change only the look: photoreal live action.

Cast: the white mannequin is @Image 1. The wooden mannequin is @Image 2.
Location: @Image 3, same layout and light direction as @Video 1.

Action: [beats with seconds, taken from the scene's timeline]
Performance: [emotion, dialogue language, lip sync if needed].
Background motion: [every other moving element: traffic, passers-by, steam, lamps, leaves...].
Camera feel: handheld, natural micro-shake as in @Video 1. No mannequin features, no wooden skin, no text.
```

Tips: distinct mannequin colours plus the cast lines prevent identity swaps. Very fast whip pans and full 360s lose identity, so do those as separate shots. Name the beats with seconds; the model follows blocking better when the beats are spelled out.

## Blender (optional)

The **Export .glb** button saves the scene, and **Camera path** saves a take's path JSON. `https://sirmobyi.github.io/camlink/blender/camlink_blender.py` has `camlink_import_scene(glb)` and `camlink_import_take(json)`, which key a camera with the same axes. Through Blender MCP, fetch that file's text and run it with `execute_blender_code`, followed by the two calls. Procedural motion from the timeline is not in the .glb.

## Troubleshooting

- **Red message instead of a scene**: read it. A WebGL message means the browser has 3D off (Brave: lower Shields for the site or turn on graphics acceleration). Chrome, Safari and the Claude browser work. A scene error names the line: fix the code and load it again.
- **Phone stuck on "connecting…"**: reload the computer page and rescan. If it still won't link, put both devices on the same Wi-Fi or the phone's hotspot (some office networks block peer-to-peer).
- **"no motion sensor events"** on iPhone: Settings → Safari → Motion & Orientation Access on, then reload.
- **Pan drifts**: tap Recenter.
- **No MP4**: the browser lacks WebCodecs (very old Safari). Use the Realtime button on the take.