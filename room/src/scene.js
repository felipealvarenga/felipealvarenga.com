// The agent control room: walls, the screen wall, the desk with real models, lamps, the rain window.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { SECTIONS, makeScreen, agentScreen } from "./screens.js";
import { makeWindow } from "./rain.js";

export const W=8, D=7, H=3.1;          // room in metres; the screen wall is at z=-D/2
const ASSETS=new URL("../assets/",import.meta.url);

export async function buildScene(renderer,manager){
  RectAreaLightUniformsLib.init();
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x05060a); scene.fog=new THREE.Fog(0x05060a,7,16);
  const loader=new GLTFLoader(manager); loader.setMeshoptDecoder(MeshoptDecoder);
  const rgbe=new RGBELoader(manager);

  /* environment for reflections only */
  const hdr=await rgbe.loadAsync(new URL("hdri/dikhololo_night_1k.hdr",ASSETS).href);
  hdr.mapping=THREE.EquirectangularReflectionMapping; scene.environment=hdr; scene.environmentIntensity=.25;

  /* shell */
  const matWall=new THREE.MeshStandardMaterial({color:0x171a20,roughness:.92,metalness:0});
  const matFloor=new THREE.MeshStandardMaterial({color:0x0c0e12,roughness:.32,metalness:.15,envMapIntensity:.9});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(W,D),matFloor); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({color:0x101216,roughness:1})); ceil.rotation.x=Math.PI/2; ceil.position.y=H; scene.add(ceil);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(W,H),matWall); back.position.set(0,H/2,-D/2); back.receiveShadow=true; scene.add(back);
  const front=new THREE.Mesh(new THREE.PlaneGeometry(W,H),matWall); front.rotation.y=Math.PI; front.position.set(0,H/2,D/2); scene.add(front);
  const left=new THREE.Mesh(new THREE.PlaneGeometry(D,H),matWall); left.rotation.y=Math.PI/2; left.position.set(-W/2,H/2,0); left.receiveShadow=true; scene.add(left);
  /* right wall with a window opening */
  const rightShape=new THREE.Shape(); rightShape.moveTo(-D/2,0); rightShape.lineTo(D/2,0); rightShape.lineTo(D/2,H); rightShape.lineTo(-D/2,H); rightShape.lineTo(-D/2,0);
  const hole=new THREE.Path(); const wx=0.2,wy=1.0,ww=2.6,wh=1.5; hole.moveTo(wx-ww/2,wy); hole.lineTo(wx+ww/2,wy); hole.lineTo(wx+ww/2,wy+wh); hole.lineTo(wx-ww/2,wy+wh); hole.lineTo(wx-ww/2,wy); rightShape.holes.push(hole);
  const right=new THREE.Mesh(new THREE.ShapeGeometry(rightShape),matWall); right.rotation.y=-Math.PI/2; right.position.set(W/2,0,0); right.receiveShadow=true; scene.add(right);
  const win=makeWindow(ww,wh); win.mesh.rotation.y=-Math.PI/2; win.mesh.position.set(W/2+.02,wy+wh/2,-wx); scene.add(win.mesh);
  const frameMat=new THREE.MeshStandardMaterial({color:0x22262e,roughness:.6,metalness:.3});
  for(const [a,b,c,d] of [[ww+.1,.06,0,wy],[ww+.1,.06,0,wy+wh],[.06,wh,-ww/2,wy+wh/2],[.06,wh,ww/2,wy+wh/2],[.04,wh,0,wy+wh/2]]){ const f=new THREE.Mesh(new THREE.BoxGeometry(.05,b,a),frameMat); f.position.set(W/2-.01,d,-wx-c); scene.add(f); }
  const moon=new THREE.RectAreaLight(0x8fa6ff,1.6,ww,wh); moon.position.set(W/2-.05,wy+wh/2,-wx); moon.lookAt(0,wy+wh/2,-wx); scene.add(moon);

  /* the screen wall: 5 x 3, four big section screens */
  const screens=[], tickers=[]; const wall=new THREE.Group(); scene.add(wall);
  const cols=5,rows=3,sw=1.28,sh=.78,gap=.1, x0=-((cols-1)*(sw+gap))/2, y0=.95, z=-D/2+.05;
  const bezelMat=new THREE.MeshStandardMaterial({color:0x1a1d24,roughness:.45,metalness:.5});
  let k=0;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const i=k++; const secIndex=(r===1&&c===1)?0:(r===1&&c===2)?1:(r===0&&c===2)?2:(r===1&&c===3)?3:-1; const sec=secIndex>=0?SECTIONS[secIndex]:null;
    const scr=sec?makeScreen(sec.name,sec.lines,sec.chart,sec.tint,i):agentScreen(i); tickers.push(scr);
    const mat=new THREE.MeshStandardMaterial({color:0x000000,roughness:.25,metalness:.1,emissive:0xffffff,emissiveMap:scr.texture,emissiveIntensity:sec?1.35:.75});
    const m=new THREE.Mesh(new THREE.PlaneGeometry(sw,sh),mat); m.position.set(x0+c*(sw+gap),y0+(rows-1-r)*(sh+gap),z+.031);
    const bezel=new THREE.Mesh(new THREE.BoxGeometry(sw+.06,sh+.06,.06),bezelMat); bezel.position.set(m.position.x,m.position.y,z); wall.add(bezel);
    m.userData={sec,screen:scr}; wall.add(m); screens.push(m);
    if(sec){ const l=new THREE.RectAreaLight(new THREE.Color(sec.tint),2.2,sw,sh); l.position.copy(m.position); l.position.z+=.02; l.lookAt(m.position.x,m.position.y,5); wall.add(l); }
  }
  /* a soft wash from the whole wall so the room reads */
  const wash=new THREE.RectAreaLight(0x9fb3d9,1.1,cols*(sw+gap),rows*(sh+gap)); wash.position.set(0,y0+(sh+gap),z+.04); wash.lookAt(0,y0+(sh+gap),5); scene.add(wash);

  /* furniture: real models, placed at true scale */
  async function put(name,x,y,z,ry=0,s=1){ const g=(await loader.loadAsync(new URL(`models/${name}.glb`,ASSETS).href)).scene; g.position.set(x,y,z); g.rotation.y=ry; g.scale.setScalar(s); g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; if(o.material&&o.material.envMapIntensity!==undefined) o.material.envMapIntensity=.6; } }); scene.add(g); return g; }
  const deskZ=-D/2+2.2;
  await Promise.all([
    put("metal_office_desk",-1.0,0,deskZ), put("metal_office_desk",1.0,0,deskZ),
    put("modern_arm_chair_01",-.75,0,deskZ+1.15,Math.PI+.35),
    put("classic_laptop",-.9,.79,deskZ-.05,-.12),
    put("desk_lamp_arm_01",1.55,.79+.09,deskZ-.2,-.6),
    put("stationery_supplies",.55,.79+.04,deskZ+.1,.4),
    put("modern_ceiling_lamp_01",0,H-.2,deskZ+.6),
  ]);

  /* lights: warm lamp over the desk, cool spill, a little ambient so blacks are not holes */
  scene.add(new THREE.AmbientLight(0x5a6a99,.12)); scene.add(new THREE.HemisphereLight(0x2b3350,0x07080a,.35));
  const lamp=new THREE.SpotLight(0xffd9a8,8,6,Math.PI/3.2,.7,1.5); lamp.position.set(0,H-.95,deskZ+.6); lamp.target.position.set(0,.8,deskZ); scene.add(lamp,lamp.target); lamp.castShadow=true; lamp.shadow.mapSize.set(1024,1024); lamp.shadow.bias=-.0005;
  const deskLamp=new THREE.PointLight(0xffc98a,1.8,2.6,2); deskLamp.position.set(1.4,1.45,deskZ-.25); scene.add(deskLamp);
  const spill=new THREE.PointLight(0x4e7bff,2.5,7,2); spill.position.set(-2.8,2.2,1.2); scene.add(spill);

  return {scene,screens,tickers,win,deskZ};
}
