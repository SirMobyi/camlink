---
name: phone-virtual-camera
description: Use when someone says "use camlink" or wants a 3D blocking scene with character and object motion, shot with their phone as a handheld virtual camera or by an Auto camera (shot list with moves, cuts and lenses), then handed to Seedance, Luma or Runway.
---

# camlink: 3D blocking with a phone camera or an Auto camera

camlink is a hosted web app: **https://sirmobyi.github.io/camlink/**

- The computer shows the 3D blocking scene with a timeline (beat ticks, shot segments, scrubbing), framing guides (thirds, 9:16, 4:5, 1:1) and a lens slider. The phone scans a QR code and becomes the camera: gyro for tilt and pan, sticks for dolly, truck and up/down, lens presets and a zoom slider, Rehearse, Reset shot, Hold to reposition.
- **Three camera modes** when the scene has a shot list (key `A` cycles them):
  - **Manual**: the user frames and moves the camera with the mouse or the phone. Scripted moves (push, pull, truck, crane, orbit) can carry the camera like a dolly.
  - **Auto**: the scene's shot list drives the camera: framings, moves, lenses, hard cuts, whip pans.
  - **Hybrid**: the Auto shots, with the phone's handheld aim layered on top.
- Nothing to install and no Terminal. Works in Chrome, Safari and the Claude app's browser pane. Phone and computer link peer to peer, on any network.
- Exports: a frame-exact **clean 24fps MP4** of every take, the first frame PNG, the realtime clip and the camera path JSON. With a shot list also **Render Auto take** (no realtime pass), **Per-shot MP4s** (one file per shot) and **Shot list** (JSON with a prompt line per shot).
- **A scene lives inside its link** (`#scene=<compressed code>`), so every scene is a shareable URL. Demo scenes: `?scene=the-letter` (two-hander with an eight-shot Auto camera), `?scene=cafe-argument`, `?scene=street-pickup`.

Your job: turn the user's description into a scene file with good blocking and, by default, a shot list; load it, check it, and hand over a link.

## Workflow

1. **Brief.** You need the location, the cast (who, rough look, where they start), the beats with timing (who moves where, what objects move), the duration, and optionally aspect ratio, lens feel and camera intent. Ask one compact question only for what is missing. Defaults: 16:9, 8 to 12 s.
2. **Block the action first** (see Blocking). Plan beats on paper with seconds.
3. **Design the shots** (see Shot design), unless the user only wants to operate the camera by hand. A user who describes camera moves, cuts or lenses, or says "auto", gets them as a shot list. With no camera direction, write one anyway: the viewer opens in Auto and Manual is one click away.
4. **Write the scene** with the contract and kit below. Give each character a distinct mannequin colour and name them by colour (`A_white`, `B_blue`, `C_wood`), so the generation prompt can map colours to reference images.
5. **Load it.**
   - If the built-in browser is available (Claude desktop app): open `https://sirmobyi.github.io/camlink/` with `preview_start` (allow the site once if asked). Run `await camlink.loadScene(<the scene code as a JSON string literal>)` with `javascript_tool`. It returns `{ok, name, link}` or `{ok:false, error}`. Fix any error and load again. The phone stays connected across reloads.
   - Otherwise build the link in code and give it to the user, and also send the scene as `<name>.js` (it can be dragged onto the page):
     ```python
     import zlib, base64
     c = zlib.compressobj(9, zlib.DEFLATED, -15)          # raw deflate
     raw = c.compress(code.encode()) + c.flush()
     link = "https://sirmobyi.github.io/camlink/#scene=" + base64.urlsafe_b64encode(raw).decode().rstrip("=")
     ```
6. **Check it** (built-in browser).
   - With shots: `camlink.shots` lists each shot with `start`, `end` and a prompt `line`. For each shot, `camlink.seek((start + end) / 2)` and take a screenshot (scale 0.5 is enough). Check that the subject is in frame with sensible headroom, nothing sits between the camera and the subject, the camera is not inside a wall or a body, and the beat the shot is for is visible. Fix framings or timing and reload. Finish with `camlink.setMode('auto')` and `camlink.seek(0)`.
   - Without shots: `camlink.framing([x,y,z],[tx,ty,tz], mm)` sets a view (and the shot's reset point), then `camlink.seek(t)` and one screenshot per key beat (two or three). `framing()` switches the viewer to Manual.
   - Either way, look for characters walking through furniture, props not in hands, people facing the wrong way.
   - Optional presets for Manual: `camlink.setMove('push'|'pull'|'truckL'|'truckR'|'craneUp'|'craneDown'|'orbitL'|'orbitR'|'none', 'subtle'|'medium'|'big')`, `camlink.setGuide('9:16'|'4:5'|'1:1'|'thirds'|'none')`, `camlink.setFormat('9:16', 1080)`, `camlink.setLens(mm)`. Say what you preset.
7. **Hand over.** Give the link and the steps for the mode in use:
   - **Auto**: open **Takes → Render Auto take** for the clean MP4 (or press R to record it in realtime). **Per-shot MP4s** and **Shot list** sit on the take. Shots are the blocks under the timeline; click one to jump to it.
   - **Hybrid / Manual**: click **Connect phone**, scan the QR, tap **Start**, allow motion. Pick **Hybrid** to add handheld aim to the Auto shots, or **Manual** to frame with the mouse and let the phone take over. **Rehearse** (or Space) plays the action; **Hold to reposition** freezes the shot while re-gripping; **Reset shot** returns to the start framing. Tap the red button (or R) to record; recording stops when the action ends and the clean MP4 downloads.
8. **Iterate** on notes ("tighter on B at the reaction", "cut to the insert earlier", "car comes from the other side"): edit and load again. Each load gives a new link; the old link still opens the old version.
9. **Generate** with the prompt templates at the end, when asked.

## Blocking

Video models copy what the grey-box shows, so blocking errors become generation errors.

- Grey proxies at true scale: rooms 3 m high, doors 2.1 m, tables 0.75 m, cars 4.2 m. Flat colours, no textures. Distinct silhouettes and colours per character.
- Facing is legible: the mannequin's nose cone shows where it looks. Characters in a conversation face each other (`endFace`, `look`, `rotY` keys) unless the beat says otherwise.
- Make interactions explicit: a hand-off is `attach` to A, a short `move`, then `attach` to B at the moment hands meet. Doors open before anyone walks through them; build a real doorway gap in the wall (wall pieces from `box`) when someone enters through it.
- No foot sliding: translate actors only with `tl.walk` (it plays a walk cycle). Use `tl.move` on an actor only for turning on the spot (`rotY`) or tiny shifts. One `tl.walk` per actor, and never `walk` plus `move` on the same actor: the walk owns the position for the whole timeline.
- Keep paths clear of furniture by at least 0.35 m from the actor's centre. Leave about 1 s of settle at the start. Keep beats at least 0.6 s apart so each reads on camera.
- Backgrounds should move a little in exteriors (a passer-by, a car), so the generation has life to keep.

## Shot design

- Coverage for two people: `const cov = () => kit.coverage(A, B, { side })`. All its cameras sit on one side of the A-B line, so screen direction holds across cuts (180 degree rule). Pick the `side` whose cameras land inside the room; check with screenshots.
- Shape: open wide to establish geography, tighten as the scene heats up, come back wider to release. Typical: wide → medium or two-shot → over-the-shoulders and singles → insert on the key prop → reaction close-up → a closing wider or motivated move.
- Cut on a beat or on motion (a turn, a reach, a door). Shots at least 0.8 s; 1.5 to 3 s is the norm in an 8 to 12 s scene. Six to nine shots per 10 s is plenty.
- Avoid jump cuts: consecutive shots differ by at least two sizes (MS → CU) or 30 degrees of angle.
- Lenses: 18 to 24 mm for wides and space, 32 to 40 for mediums, 50 to 85 for singles and inserts. `coverage` and `frame` pick lenses that fit the size.
- Moves must be motivated: push in for tension or realisation, pull out for reveal or isolation, track with a walker (`live: true`), crane for scale. Keep `amount` 0.25 to 0.6. One whip pan per scene at most, for an energy change.
- `shake`: 0 locked-off, 0.15 to 0.3 handheld, 0.5 nervous. `roll` (degrees) for a Dutch angle, sparingly.
- Moving subjects need `live: true`, so the framing follows them each frame. Static framings are computed once at the shot's start (and end, for `to`).

## Scene contract

```js
export const name = 'kebab-case-name';     // used for take file names
export const duration = 10;                // action length in seconds
export function build({ THREE, kit }) {    // may be async (await kit.loadGLB)
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c9d3da');
  kit.lights(scene, { sun: [5, 8, 4] });
  // ... set, props, cast, timeline
  const tl = kit.timeline() /* .walk(...).poses(...).move(...) */;
  const shots = kit.shots([ /* optional, see Shot list */ ]);
  return { scene, update: tl.update, shots, camera: { pos: [x, y, z], target: [x, y, z], mm: 35 } };
}
```

Rules: no `import` statements (THREE and kit are passed in); metres, +Y up; characters, chairs, benches, doors and cars face **+Z** at rotation 0 (`kit.at(obj, x, y, z, 180)` faces -Z, 90 faces +X). `update(t)` must be a pure function of t (no accumulation), because renders replay it frame by frame. `camera` is the Manual start framing.

## Kit reference

**Set and props**
- `lights(scene, {sun:[x,y,z], sunIntensity=2.2, ambient=0.9, sky, ground})` once per scene.
- `room({w, d, h, wall, floor, ceiling, walls:{px,nx,pz,nz}, wainscot, wainscotH})`: interior box centred on the origin. Its walls are solid; for a doorway, make the room deeper and build that wall from `box` pieces with a gap.
- `floorPlane(size, color)` for exteriors. `box(w, h, d, color, [x,y,z])` sits on the ground at its position (buildings, counters, kerbs, wall pieces, a letter or phone as a thin box).
- `roundTable({r, h})`, `table({w, d, h})`, `chair({color, seatH})`, `bench({w})`, `cup()`, `crate({s})`, `plant({h})`, `pendantLamp({ceilingH, drop})`, `windowPanel({w, h, sill, glow})` (glowing, faces +Z), `door({w, h, color})` (hinge on its -X edge; swing `door.userData.leaf` with `y: -85` to open toward +Z), `car({color})` (about 4.2 m, front at +Z).
- `at(obj, x, y, z, rotYDeg)` positions anything and returns it. `face(obj, [x,y,z])` turns it toward a point.
- `await loadGLB('name.glb' | url, {scale})`: the user's own model, dropped onto the page (by file name) or from a URL.

**Cast**
- `mannequin({color, height=1.75, pose, name})`: a wooden artist mannequin with a nose cone, so facing reads on camera.
- Poses: `stand, sit, sitTable, point, armsCrossed, handsUp, phone, carry, offer, wave, lookDown, read, shock`. Custom pose: `{ ...kit.POSES.sit, armR: [-80, 0, -5], neck: [20, 0, 0] }`. Joints: `hips` (`{y}`, standing 0.95, seated 0.54), `spine, neck, armL, armR, elbowL, elbowR, legL, legR, kneeL, kneeR` as `[xDeg, yDeg, zDeg]`. Negative x swings a limb forward (arm -90 points ahead), a negative elbow x bends the forearm up, a positive knee x bends the knee back.
- A seated actor uses the same position and rotation as their chair, with pose `sit` or `sitTable`.

**Motion: `const tl = kit.timeline()`, chainable, then `update: tl.update`**
- `tl.walk(m, [[x,y,z], ...], {start, speed=1.3, endFace:[x,y,z], endPose})`: walks the path with a walk cycle. Before `start` the actor stands at the first point facing along the path.
- `tl.poses(m, [{t, pose, blend=0.4}, ...])`: pose beats. The walk cycle overrides it while walking.
- `tl.move(obj, [{t, pos:[x,y,z], rotY, scale}, ...])`: eased keyframes for any object (cars, a falling box, a lift) and for turning an actor on the spot (`rotY` only; take the short way round, e.g. -90 to -235.5 rather than to 124.5).
- `tl.rotate(obj, [{t, x, y, z}, ...])`: degrees. Door swing: `tl.rotate(door.userData.leaf, [{t:1, y:0}, {t:1.6, y:-85}])`.
- `tl.attach(prop, m, {at, until, joint='elbowR', offset:[x,y,z]})`: the prop follows a hand (or any object: pass a car as `m` and `joint: 'none'`) between `at` and `until`.
- `tl.look(m, target, {from, until})`: keeps turning m toward a point or object.
- `tl.call((t) => { ... })` for anything else (prop orientation, lights, a screen colour).
- Beat times from the timeline show as ticks on the viewer's scrubber.

**Shot placement** (all return `{pos, target, mm}`; sizes `ECU CU MCU MS MWS WS EWS`)
- `kit.frame(subject, {size='MS', yaw=0, angle='eye'|'low'|'high'|'top', lens, toward, lift, aspect})`: one subject. `yaw` is degrees around the subject from its front (+ toward its left). `toward: point or object` puts the camera on that side instead.
- `kit.coverage(A, B, {side=1, size='MCU', aspect})` → `{wide, two, otsA, otsB, cuA, cuB, insert(obj, size='CU'), normal}`. `otsA` is over A's shoulder onto B; `cuA` is a single on A.
- `kit.move(cam, kind, amount)`: end framing of `push pull truckL truckR craneUp craneDown orbitL orbitR zoomIn zoomOut dollyZoom`.
- Subjects are mannequins (framed by the eyes), any object (by its centre) or a point. For a non-16:9 format pass `aspect` (e.g. `9 / 16`).

## Shot list

```js
const cov = () => kit.coverage(A, B, { side: -1 });
const shots = kit.shots([
  { t: 0,   name: 'Establishing', cam: { pos: [2.6, 2.3, 2.6], target: [-1.3, 1, -0.9], mm: 22 }, move: 'push', amount: 0.35, shake: 0.15,
    desc: 'Wide, high from the corner: A reads by the window, B walks in' },
  { t: 2.0, name: 'B walks in',   cam: () => kit.frame(B, { size: 'MWS', toward: [0.6, 1.5, 1.4] }), live: true, shake: 0.3, desc: '...' },
  { t: 3.9, name: 'Two-shot',     cam: () => cov().two, move: 'push', amount: 0.25, desc: '...' },
  { t: 4.8, name: 'Insert',       cam: () => cov().insert(letter, 'MCU'), live: true, desc: '...' },
  { t: 7.4, name: 'Reaction',     cam: () => cov().cuB, move: 'push', amount: 0.5, shake: 0.25, desc: '...' },
  { t: 8.8, name: 'Back to window', cam: () => kit.frame(A, { size: 'MWS', yaw: 160 }), live: true, transition: 'whip', desc: '...' },
]);
```

Fields: `t` start time (a shot runs to the next shot's `t`; the first starts at 0), `cam` a framing or a function of t, `move` + `amount`, or `to` (end framing or function), `ease` (`smooth` default, `linear`, `in`, `out`, `hold`), `live`, `shake`, `roll`, `transition` (`cut` default, `whip`), `name`, `desc`. Functions run with the action already posed at that time, so they frame people where they are. Write `desc` as the prompt line for that shot: size, subject, action, move. Keep the blocking in the timeline and the camera in the shots; never move props from a shot function.

Viewer API for shots: `camlink.setMode('manual'|'auto'|'hybrid')`, `camlink.mode`, `camlink.shots`, `camlink.shotAt(t)`, `await camlink.renderAuto()` (renders and downloads the Auto take), `camlink.busy`.

## Handing the take to a video model

Use `<take>_clean.mp4`, trimmed to the generation length. Attach character and location references as images, tag them @Image 1, @Image 2 and so on, and tag the take as @Video 1. Keep the prompt under 2500 characters, don't re-describe what the references show, give every moving element its own motion line, and state what the reference transfers instead of re-describing the camera.

**Single shot (Manual or Hybrid take, or one per-shot MP4)**
```
@Video 1 is a grey-box 3D blocking pass. Take the camera, lens, framing, character blocking and
timing from @Video 1, frame for frame. Change only the look: photoreal live action.

Cast: the white mannequin is @Image 1. The blue mannequin is @Image 2.
Location: @Image 3, same layout and light direction as @Video 1.

Action: [beats with seconds, from the scene's timeline]
Performance: [emotion, dialogue language, lip sync if needed].
Background motion: [every other moving element: traffic, passers-by, steam, lamps, leaves...].
Camera feel: as in @Video 1. No mannequin features, no wooden skin, no text.
```

**Multi-shot (Auto take)**: use the **Shot list** export. Its `prompt` field starts the prompt and lists one line per shot with its time range:
```
@Video 1 is a 6-shot grey-box blocking pass. Keep its cuts, framing, lens and camera movement;
take the timing of every cut from @Video 1.
Shot 1 (0.0–2.0 s): Wide, high from the corner: A reads by the window, B walks in. 22mm, push in, handheld.
Shot 2 (2.0–3.9 s), hard cut: ...
```
Then the Cast, Location, Performance and Background motion lines as above. If the model handles one shot per generation, send **Per-shot MP4s** one at a time with that shot's line, and pass the previous shot's last frame for continuity where the model accepts a first frame.

Tips: distinct mannequin colours plus the cast lines prevent identity swaps. Very fast whip pans and full 360s lose identity; keep them short or split them. For image-to-video, style the take's first frame PNG into the keyframe and pass it with the clean MP4.

## Blender (optional)

**Export .glb** saves the scene, and **Camera path** saves a take's path JSON (Auto takes are baked at 24 fps, `cuts` lists the cut times). `https://sirmobyi.github.io/camlink/blender/camlink_blender.py` has `camlink_import_scene(glb)` and `camlink_import_take(json)`, which key a camera with the same axes. Through Blender MCP, fetch that file's text and run it with `execute_blender_code`, followed by the two calls. Procedural motion from the timeline is not in the .glb.

## Troubleshooting

- **Red message instead of a scene**: read it. A WebGL message means the browser has 3D off (Brave: lower Shields for the site or turn on graphics acceleration). Chrome, Safari and the Claude browser work. A scene or shot list error names the problem: fix the code and load again.
- **A shot frames a wall or the back of a head**: flip `side` in `coverage`, change `yaw` or `toward` in `frame`, or move the shot's `t` to after the actor has turned.
- **Phone stuck on "connecting…"**: reload the computer page and rescan. If it still won't link, put both devices on the same Wi-Fi or the phone's hotspot (some office networks block peer-to-peer).
- **"no motion sensor events"** on iPhone: Settings → Safari → Motion & Orientation Access on, then reload.
- **Pan drifts, or the operator runs out of room to turn**: Hold to reposition, turn, let go.
- **Per-shot MP4s stop after the first file**: the browser is asking to allow multiple downloads; allow it.
- **No MP4**: the browser lacks WebCodecs (very old Safari). Use the Realtime button on the take.
