# camlink

Use your phone as a handheld virtual camera on a 3D blocking scene, then hand the take to Seedance, Luma or Runway as the motion reference.

**Open:** https://sirmobyi.github.io/camlink/

1. Open the link on your computer (Chrome, Safari or the Claude app browser).
2. Scan the QR code with your phone, tap **Start**, allow motion.
3. Frame with the mouse, tap **Recenter** on the phone, then **REC**.
4. A clean 24fps MP4 of each take lands in your Downloads.

Scenes travel inside the link (`#scene=...`), so a scene link can be shared with anyone. Claude writes scenes with the kit in `kit.js` (mannequins, props, `kit.timeline()` for character and object motion). Demo scenes: `?scene=cafe-argument`, `?scene=street-pickup`.

Blender: `blender/camlink_blender.py` imports a take's camera path and the exported `.glb` scene.

Libraries in `vendor/`: three.js r160 (MIT), PeerJS 1.5.4 (MIT), mp4-muxer 5.1.3 (MIT), qrcode-generator 1.4.4 (MIT).
