# felipealvarenga.com, the room (hi-fi version)

Goal: a hi-fi 3D version of the site on par with felixrieseberg.com/?room=1, with the lo-fi reading version as the default and an AUTO rule. One project, one folder: `room/`.

Reference stack (read from Felix's bundle on 2026-10-28): three.js, GLTFLoader with a modeled scene and baked lightmaps, RectAreaLight for screens, EffectComposer with UnrealBloom, a rain shader on the window, OrbitControls-style camera. 55+ versions.

## Structure

```
room/
  index.html        page shell, gate, nav, importmap
  src/
    main.js         boot: loader, composer, loop
    scene.js        room geometry, GLTF placement, lights
    screens.js      canvas textures with the real content, animation
    rain.js         window + rain shader
    controls.js     camera rig, drag/parallax, hotspots, keyboard
    gate.js         loading progress (bytes), enter, AUTO rule
  assets/
    models/*.glb    CC0 from Poly Haven, compressed with gltf-transform (draco or meshopt), target < 6 MB total
    hdri/*.hdr      night HDRI 1k for reflections only
    lightmaps/      later, when we bake
tasks/              this plan, context, lessons (ignored by the deploy)
```

## Milestones

- [x] M0 Plan approved, assets approved for download (Felipe, 28 Oct)
- [x] M1 Assets (1.7 MB models, 1.7 MB HDRI): desk, office chair, laptop, desk lamp, stationery, plant, ceiling lamp; compress; license file with attribution
- [x] M2 Scene, first pass (bloom, HDRI, RectAreaLight screens, rain window): GLTF placement, HDRI, screens as emissive boxes with RectAreaLight, bloom, fog, floor reflection
- [ ] M3 Window with rain shader and a night city/mountain backdrop; lamp warmth vs screen cool
- [x] M4 Screens, first pass (3 big, 5 agents, in-room panel with the real sections, focus flights): live canvases (PR counter, Slack lines, P&L chart) that tick; hover zoom; click opens section
- [ ] M5 Gate: byte-counted loading, Enter, AUTO rule, LO-FI link, Esc; reduced-motion respected
- [ ] M6 Phone: lower pixel ratio, no bloom, tap targets, portrait framing
- [ ] M7 Polish: sound toggle, your objects (CFP certificate frame, Vety sticker), easter eggs
- [ ] M8 Perf budget: first frame < 3 s on a 2020 laptop, 60 fps desktop, < 8 MB transfer

## Rules

- No new runtime dependency beyond three.js and its addons, pinned by version in the importmap.
- Every asset has a LICENSE line (Poly Haven is CC0; attribution is a courtesy).
- The lo-fi site never depends on the room. The room breaking must not break reading.
- Verify each milestone with a headless render (software GL) and once on Felipe's GPU.
