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
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x05060a); scene.fog=new THREE.Fog(0x05060a,8,18);
  const loader=new GLTFLoader(manager); loader.setMeshoptDecoder(MeshoptDecoder);
  const rgbe=new RGBELoader(manager);

  const hdr=await rgbe.loadAsync(new URL("hdri/dikhololo_night_1k.hdr",ASSETS).href);
  hdr.mapping=THREE.EquirectangularReflectionMapping; scene.environment=hdr; scene.environmentIntensity=.2;

  /* shell */
  const matWall=new THREE.MeshStandardMaterial({color:0x14171d,roughness:.9,metalness:0});
  const matFloor=new THREE.MeshStandardMaterial({color:0x08090c,roughness:.24,metalness:.2,envMapIntensity:1.2});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(W,D),matFloor); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({color:0x0c0e12,roughness:1})); ceil.rotation.x=Math.PI/2; ceil.position.y=H; scene.add(ceil);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(W,H),matWall); back.position.set(0,H/2,-D/2); back.receiveShadow=true; scene.add(back);
  const front=new THREE.Mesh(new THREE.PlaneGeometry(W,H),matWall); front.rotation.y=Math.PI; front.position.set(0,H/2,D/2); scene.add(front);
  const left=new THREE.Mesh(new THREE.PlaneGeometry(D,H),matWall); left.rotation.y=Math.PI/2; left.position.set(-W/2,H/2,0); left.receiveShadow=true; scene.add(left);
  /* right wall with the window */
  const wx=-.6,wy=1.0,ww=2.8,wh=1.6;
  const rightShape=new THREE.Shape(); rightShape.moveTo(-D/2,0); rightShape.lineTo(D/2,0); rightShape.lineTo(D/2,H); rightShape.lineTo(-D/2,H); rightShape.lineTo(-D/2,0);
  const hole=new THREE.Path(); hole.moveTo(wx-ww/2,wy); hole.lineTo(wx+ww/2,wy); hole.lineTo(wx+ww/2,wy+wh); hole.lineTo(wx-ww/2,wy+wh); hole.lineTo(wx-ww/2,wy); rightShape.holes.push(hole);
  const right=new THREE.Mesh(new THREE.ShapeGeometry(rightShape),matWall); right.rotation.y=-Math.PI/2; right.position.set(W/2,0,0); right.receiveShadow=true; scene.add(right);
  const win=makeWindow(ww,wh); win.mesh.rotation.y=-Math.PI/2; win.mesh.position.set(W/2+.02,wy+wh/2,-wx); scene.add(win.mesh);
  const frameMat=new THREE.MeshStandardMaterial({color:0x262a33,roughness:.55,metalness:.3});
  for(const [a,b,c,d] of [[ww+.12,.07,0,wy],[ww+.12,.07,0,wy+wh],[.07,wh,-ww/2,wy+wh/2],[.07,wh,ww/2,wy+wh/2],[.04,wh,0,wy+wh/2]]){ const f=new THREE.Mesh(new THREE.BoxGeometry(.06,b,a),frameMat); f.position.set(W/2-.01,d,-wx-c); scene.add(f); }
  const moon=new THREE.RectAreaLight(0x8fa6ff,2.2,ww,wh); moon.position.set(W/2-.05,wy+wh/2,-wx); moon.lookAt(0,wy+wh/2,-wx); scene.add(moon);

  /* the screen wall: three big section screens at eye level, press to the right, a strip of agent screens above */
  const screens=[], tickers=[]; const wall=new THREE.Group(); scene.add(wall);
  const z=-D/2+.05; const bezelMat=new THREE.MeshStandardMaterial({color:0x1a1d24,roughness:.45,metalness:.5});
  function addScreen(x,y,w,h,scr,sec){
    const mat=new THREE.MeshStandardMaterial({color:0x000000,roughness:.25,metalness:.1,emissive:0xffffff,emissiveMap:scr.texture,emissiveIntensity:sec?1.5:.8});
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat); m.position.set(x,y,z+.031);
    const bezel=new THREE.Mesh(new THREE.BoxGeometry(w+.06,h+.06,.06),bezelMat); bezel.position.set(x,y,z); wall.add(bezel);
    m.userData={sec,screen:scr,w,h}; wall.add(m); screens.push(m); tickers.push(scr);
    if(sec){ const l=new THREE.RectAreaLight(new THREE.Color(sec.tint),2.6,w,h); l.position.set(x,y,z+.05); l.lookAt(x,y,5); wall.add(l); }
    return m;
  }
  const bw=1.9,bh=1.19,by=1.45;
  addScreen(-2.05,by,bw,bh,makeScreen(SECTIONS[0].name,SECTIONS[0].lines,SECTIONS[0].chart,SECTIONS[0].tint,0,SECTIONS[0].caption),SECTIONS[0]);
  addScreen(0,by,bw,bh,makeScreen(SECTIONS[1].name,SECTIONS[1].lines,SECTIONS[1].chart,SECTIONS[1].tint,1,SECTIONS[1].caption),SECTIONS[1]);
  addScreen(2.05,by,bw,bh,makeScreen(SECTIONS[2].name,SECTIONS[2].lines,SECTIONS[2].chart,SECTIONS[2].tint,2,SECTIONS[2].caption),SECTIONS[2]);
  addScreen(3.1,2.5,1.0,.62,makeScreen(SECTIONS[3].name,SECTIONS[3].lines,null,SECTIONS[3].tint,3),SECTIONS[3]);
  for(let i=0;i<5;i++) addScreen(-2.4+i*1.2,2.5,1.0,.62,agentScreen(i),null);
  const wash=new THREE.RectAreaLight(0x9fb3d9,.9,7,2.4); wash.position.set(0,1.8,z+.05); wash.lookAt(0,1.8,5); scene.add(wash);

  /* furniture at true scale */
  async function put(name,x,y,z,ry=0,s=1){ const g=(await loader.loadAsync(new URL(`models/${name}.glb`,ASSETS).href)).scene; g.position.set(x,y,z); g.rotation.y=ry; g.scale.setScalar(s); g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; if(o.material&&o.material.envMapIntensity!==undefined) o.material.envMapIntensity=.5; } }); scene.add(g); return g; }
  const deskZ=-D/2+2.3;
  await Promise.all([
    put("metal_office_desk",-1.0,0,deskZ), put("metal_office_desk",1.0,0,deskZ),
    put("modern_arm_chair_01",-1.1,0,deskZ+1.2,Math.PI+.5),
    put("classic_laptop",-.9,.79,deskZ-.05,-.12),
    put("desk_lamp_arm_01",1.6,.79+.09,deskZ-.25,-.7),
    put("stationery_supplies",.5,.79+.04,deskZ+.15,.4),
    put("modern_ceiling_lamp_01",.4,H-.2,deskZ+.8),
  ]);

  /* light: a warm pool on the desk, cool spill from the window side, a floor of ambient so blacks are not holes */
  scene.add(new THREE.AmbientLight(0x5a6a99,.1)); scene.add(new THREE.HemisphereLight(0x2b3350,0x07080a,.3));
  const lamp=new THREE.SpotLight(0xffd9a8,7,6,Math.PI/3.4,.75,1.5); lamp.position.set(.4,H-.95,deskZ+.8); lamp.target.position.set(0,.8,deskZ); scene.add(lamp,lamp.target); lamp.castShadow=true; lamp.shadow.mapSize.set(1024,1024); lamp.shadow.bias=-.0005;
  const deskLamp=new THREE.PointLight(0xffc98a,1.6,2.6,2); deskLamp.position.set(1.45,1.45,deskZ-.3); scene.add(deskLamp);
  const spill=new THREE.PointLight(0x4e7bff,2,7,2); spill.position.set(3.2,2.2,.6); scene.add(spill);

  return {scene,screens,tickers,win,deskZ};
}
