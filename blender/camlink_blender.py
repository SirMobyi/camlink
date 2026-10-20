"""
camlink for Blender (4.x / 5.x). Paste into the Scripting tab and Run, or exec() it through Blender MCP.

Live mode (phone drives the Blender camera in real time, REC on the phone writes keyframes):
    camlink_start()                 # drives the active scene camera; listens on UDP 127.0.0.1:9100 (camlink server forwards phone data there)
    camlink_stop()

Offline mode (bring a take recorded in the browser viewer into Blender):
    camlink_import_scene("/path/to/camlink/takes/<scene>.glb")      # same blocking scene, same coordinates
    camlink_import_take("/path/to/camlink/takes/<scene>_take_001.json")

Coordinates: camlink paths are three.js (metres, +Y up, camera looks down -Z).
Blender = (x, -z, y); rotation q_b = Rx(+90deg) @ q_t. glTF import applies the same conversion,
so an imported .glb and an imported take line up exactly.
"""
import bpy, json, math, socket, time
from mathutils import Quaternion, Vector

_C = Quaternion((1.0, 0.0, 0.0), math.radians(90.0))


def _q_t2b(q):
    x, y, z, w = q
    return _C @ Quaternion((w, x, y, z))


def _v_t2b(v):
    return Vector((v[0], -v[2], v[1]))


def _yaw(qb):
    f = qb @ Vector((0.0, 0.0, -1.0))
    return math.atan2(f.y, f.x)


def _get_camera(name=None):
    """name=None: use the scene's active camera (create 'PhoneCam' if there is none)."""
    scene = bpy.context.scene
    cam = bpy.data.objects.get(name) if name else scene.camera
    if cam is None or cam.type != "CAMERA":
        name = name or "PhoneCam"
        data = bpy.data.cameras.new(name)
        cam = bpy.data.objects.new(name, data)
        scene.collection.objects.link(cam)
        cam.location = (0.0, -4.0, 1.6)
        cam.rotation_mode = "QUATERNION"
        cam.rotation_quaternion = Quaternion((1, 0, 0), math.radians(90))
    cam.data.sensor_width = 36.0
    cam.data.sensor_fit = "AUTO"
    if cam.rotation_mode != "QUATERNION":
        cam.rotation_mode = "QUATERNION"
    scene.camera = cam
    return cam


def _redraw():
    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == "VIEW_3D":
                area.tag_redraw()


class _CamLink:
    def __init__(self, port=9100, cam_name=None):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.sock.bind(("127.0.0.1", port))
        self.sock.setblocking(False)
        self.cam_name = cam_name
        self.pose = None
        self.seen = False
        self.on = False
        self.base = Vector()
        self.q_off = Quaternion()
        self.xr_ref = None
        self.joy = Vector()
        self.rec = None
        self.stopped = False
        self.last = time.perf_counter()
        print(f"[camlink] Blender listening on UDP {port}, camera '{cam_name}'")

    def calibrate(self):
        if not self.pose:
            return
        cam = _get_camera(self.cam_name)
        mw = cam.matrix_world
        self.base = mw.translation.copy()
        pq = _q_t2b(self.pose["q"])
        self.q_off = Quaternion((0.0, 0.0, 1.0), _yaw(mw.to_quaternion()) - _yaw(pq))
        self.xr_ref = _v_t2b(self.pose["xr"]) if self.pose.get("xr") else None
        self.joy = Vector()
        self.on = True

    def handle(self, m):
        t = m.get("t")
        if t == "pose":
            self.pose = m
            if not self.seen:
                self.seen = True
                self.calibrate()
        elif t == "recenter":
            self.calibrate()
        elif t == "rec":
            self.start_rec() if m.get("on") else self.stop_rec()

    def start_rec(self):
        if self.rec:
            return
        scene = bpy.context.scene
        cam = _get_camera(self.cam_name)
        cam.animation_data_clear()
        cam.data.animation_data_clear()
        self.rec = {"t0": time.perf_counter(), "f0": scene.frame_start, "last": None}
        scene.frame_set(scene.frame_start)
        print("[camlink] REC")

    def stop_rec(self):
        if not self.rec:
            return
        scene = bpy.context.scene
        if self.rec["last"] is not None:
            scene.frame_end = self.rec["last"]
        print(f"[camlink] STOP frames {self.rec['f0']}-{self.rec['last']}")
        scene.frame_set(self.rec["f0"])
        self.rec = None

    def apply(self, dt):
        p = self.pose
        cam = _get_camera(self.cam_name)
        tq = self.q_off @ _q_t2b(p["q"])
        yaw = _yaw(tq)
        fwd = Vector((math.cos(yaw), math.sin(yaw), 0.0))
        right = Vector((math.sin(yaw), -math.cos(yaw), 0.0))
        mv = p.get("mv") or [0, 0, 0]
        spd = p.get("spd") or 1.0
        self.joy += right * (mv[0] * spd * dt) + fwd * (mv[1] * spd * dt) + Vector((0, 0, mv[2] * spd * dt))
        tp = self.base + self.joy
        if p.get("xr") and self.xr_ref is not None:
            tp += (self.q_off @ (_v_t2b(p["xr"]) - self.xr_ref)) * (p.get("xs") or 1.0)
        sm = min(max(p.get("sm", 0.5) or 0.0, 0.0), 0.97)
        a = 1.0 - sm ** (dt * 60.0)
        cam.rotation_quaternion = cam.rotation_quaternion.slerp(tq, a)
        cam.location = cam.location.lerp(tp, a)
        if p.get("mm"):
            cam.data.lens += (p["mm"] - cam.data.lens) * a

    def key(self):
        scene = bpy.context.scene
        fps = scene.render.fps / scene.render.fps_base
        f = self.rec["f0"] + int(round((time.perf_counter() - self.rec["t0"]) * fps))
        if f == self.rec["last"]:
            return
        cam = _get_camera(self.cam_name)
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_quaternion", frame=f)
        cam.data.keyframe_insert("lens", frame=f)
        self.rec["last"] = f
        scene.frame_set(f)  # keeps animated characters in sync while you shoot

    def tick(self):
        if self.stopped:
            return None
        try:
            while True:
                data, _ = self.sock.recvfrom(65536)
                try:
                    self.handle(json.loads(data))
                except Exception as e:
                    print("[camlink] bad packet", e)
        except (BlockingIOError, OSError):
            pass
        now = time.perf_counter()
        dt = min(0.1, now - self.last)
        self.last = now
        try:
            if self.on and self.pose:
                self.apply(dt)
            if self.rec:
                self.key()
            _redraw()
        except Exception as e:
            print("[camlink] tick error", e)
        return 1.0 / 60.0

    def close(self):
        self.stopped = True
        try:
            self.sock.close()
        except Exception:
            pass


def camlink_stop():
    inst = bpy.app.driver_namespace.pop("camlink", None)
    if inst:
        inst.close()
        print("[camlink] stopped")


def camlink_start(port=9100, cam_name=None):
    """cam_name=None drives the scene's active camera (creates 'PhoneCam' if none)."""
    camlink_stop()
    cam = _get_camera(cam_name)
    inst = _CamLink(port, cam.name)
    bpy.app.driver_namespace["camlink"] = inst
    bpy.app.timers.register(inst.tick, first_interval=0.05, persistent=True)
    return inst


def camlink_recenter():
    inst = bpy.app.driver_namespace.get("camlink")
    if inst:
        inst.calibrate()


# ---------------- offline import ----------------
def _sample(path, t):
    if t <= path[0]["t"]:
        return path[0]
    if t >= path[-1]["t"]:
        return path[-1]
    lo, hi = 0, len(path) - 1
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if path[mid]["t"] <= t:
            lo = mid
        else:
            hi = mid
    a, b = path[lo], path[hi]
    k = (t - a["t"]) / ((b["t"] - a["t"]) or 1.0)
    qa = Quaternion((a["q"][3], a["q"][0], a["q"][1], a["q"][2]))
    qb = Quaternion((b["q"][3], b["q"][0], b["q"][1], b["q"][2]))
    q = qa.slerp(qb, k)
    return {"p": [a["p"][i] + (b["p"][i] - a["p"][i]) * k for i in range(3)],
            "q": [q.x, q.y, q.z, q.w], "mm": a["mm"] + (b["mm"] - a["mm"]) * k}


def camlink_import_take(json_path, cam_name=None, start_frame=1, set_resolution=True):
    with open(json_path) as f:
        data = json.load(f)
    scene = bpy.context.scene
    cam = _get_camera(cam_name or ("Cam_" + data.get("name", "take")))
    cam.animation_data_clear()
    cam.data.animation_data_clear()
    fps = scene.render.fps / scene.render.fps_base
    n = max(1, int(data["duration"] * fps))
    for i in range(n + 1):
        s = _sample(data["path"], i / fps)
        cam.location = _v_t2b(s["p"])
        cam.rotation_quaternion = _q_t2b(s["q"])
        cam.data.lens = s["mm"]
        fr = start_frame + i
        cam.keyframe_insert("location", frame=fr)
        cam.keyframe_insert("rotation_quaternion", frame=fr)
        cam.data.keyframe_insert("lens", frame=fr)
    scene.frame_start = start_frame
    scene.frame_end = start_frame + n
    if set_resolution and data.get("res"):
        scene.render.resolution_x, scene.render.resolution_y = data["res"]
        scene.render.resolution_percentage = 100
    scene.camera = cam
    print(f"[camlink] imported {data.get('name')} -> {cam.name}, frames {start_frame}-{start_frame + n} @ {fps:g}fps")
    return cam


def camlink_import_scene(glb_path):
    bpy.ops.import_scene.gltf(filepath=glb_path)
    print(f"[camlink] imported scene {glb_path}")
