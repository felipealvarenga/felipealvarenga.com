// Boot: renderer, loading gate, composer with bloom, the frame loop. The lo-fi site never depends on this file.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { buildScene } from "./scene.js";
import { makeControls } from "./controls.js";

const $=id=>document.getElementById(id);
const canvas=$("gl"), gate=$("gate"), bar=document.querySelector("#bar i"), pct=$("pct"), enter=$("enter"), label=$("label"), hint=$("hint"), status=$("status");
try{ localStorage.setItem("fa.mode","hifi"); }catch(e){}
const phone=matchMedia("(pointer:coarse)").matches||innerWidth<700;
const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;

let renderer;
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:!phone,powerPreference:"high-performance"}); }
catch(e){ $("fallback").style.display="grid"; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio,phone?1.5:2));
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=!phone; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const camera=new THREE.PerspectiveCamera(phone?62:50,1,.1,40);

/* loading: count files the room asks for; the gate opens when the first frame has rendered */
const manager=new THREE.LoadingManager();
let seen=0,total=0; const KNOWN=8; // 6 models + hdri + the first frame
manager.onProgress=(url,loaded,all)=>{ seen=loaded; total=Math.max(all,KNOWN-1); setPct(Math.round(seen/KNOWN*92)); };
manager.onError=url=>{ status.textContent="One file failed: "+url.split("/").pop()+". The room still opens."; };
function setPct(p){ bar.style.width=p+"%"; pct.textContent=p+"%"; }
setPct(3);

let composer, controls, room, running=false, last=0;
function size(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); if(composer) composer.setSize(w,h); }
addEventListener("resize",size); size();

try{
  room=await buildScene(renderer,manager);
}catch(e){ status.textContent="The room could not load: "+(e.message||e); $("fallback").style.display="grid"; throw e; }

composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(room.scene,camera));
if(!phone){ const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.42,.5,.82); composer.addPass(bloom); }
composer.addPass(new OutputPass());
size();
controls=makeControls(camera,canvas,room.screens,label,sec=>{ location.href=sec.href; });

/* first frame while the gate is still up, then stop until Enter */
controls.update(0,0); composer.render(); setPct(100); pct.textContent="100% · ready"; enter.style.display="inline-block";
if(reduced) open();

let tickAt=0;
function frame(t){
  if(!running) return;
  requestAnimationFrame(frame);
  const s=t/1000, dt=Math.min(.05,s-last||.016); last=s;
  controls.update(s,dt); room.win.update(s);
  if(s>tickAt){ tickAt=s+2.5; room.tickers[Math.floor(Math.random()*room.tickers.length)].tick(); }
  composer.render();
}
function open(){ if(running) return; running=true; gate.classList.add("out"); canvas.classList.add("on"); hint.classList.add("on"); requestAnimationFrame(t=>{ last=t/1000; frame(t); }); }
enter.addEventListener("click",open);
gate.addEventListener("click",e=>{ if(enter.style.display!=="none"&&e.target!==enter) open(); });
document.addEventListener("visibilitychange",()=>{ if(document.hidden){ running=false; } else if(gate.classList.contains("out")&&!running){ running=true; requestAnimationFrame(t=>{ last=t/1000; frame(t); }); } });
