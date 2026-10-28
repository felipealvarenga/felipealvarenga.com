// Boot: renderer, quiet loading, composer with bloom, the frame loop, and the in-room panel that shows
// each section of the lo-fi site next to its screen. The lo-fi site never depends on this file.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { buildScene } from "./scene.js";
import { makeControls } from "./controls.js";

const $=id=>document.getElementById(id);
const canvas=$("gl"), gate=$("gate"), bar=$("bar"), label=$("label"), hint=$("hint"), status=$("status"), panel=$("panel"), panelBody=$("panel-body"), panelTitle=$("panel-title");
try{ localStorage.setItem("fa.mode","hifi"); }catch(e){}
const phone=matchMedia("(pointer:coarse)").matches||innerWidth<700;
const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;

let renderer;
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:!phone,powerPreference:"high-performance"}); }
catch(e){ $("fallback").style.display="grid"; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio,phone?1.5:2));
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=!phone; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const camera=new THREE.PerspectiveCamera(phone?64:50,1,.1,40);

/* loading: a thin line at the top, no button; the room fades in when the first frame exists */
const manager=new THREE.LoadingManager(); const KNOWN=8;
manager.onProgress=(url,loaded)=>setPct(Math.round(loaded/KNOWN*92));
manager.onError=url=>{ status.textContent="One file failed: "+url.split("/").pop()+". The room still opens."; };
function setPct(p){ bar.style.width=p+"%"; status.textContent=p<100?"loading the room, "+p+"%":""; }
setPct(3);

let composer, controls, room, running=false, last=0;
function size(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); if(composer) composer.setSize(w,h); }
addEventListener("resize",size); size();

try{ room=await buildScene(renderer,manager); }
catch(e){ status.textContent="The room could not load: "+(e.message||e); $("fallback").style.display="grid"; throw e; }

composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(room.scene,camera));
if(!phone) composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.38,.55,.84));
composer.addPass(new OutputPass());
size();

/* the panel: real sections of the lo-fi page, fetched once */
let lofi=null;
async function sectionHTML(key){
  if(!lofi){ const html=await (await fetch("/?lofi=1",{cache:"force-cache"})).text(); lofi=new DOMParser().parseFromString(html,"text/html"); }
  const sec=lofi.getElementById(key); if(!sec) return "<p>Section missing.</p>";
  const clone=sec.cloneNode(true); clone.querySelectorAll("h2").forEach(h=>h.remove());
  clone.querySelectorAll("a[href^='#']").forEach(a=>a.setAttribute("href","/"+a.getAttribute("href")));
  return clone.innerHTML;
}
async function showPanel(sec){
  panelTitle.textContent=sec.name; panelBody.innerHTML="<p class='muted'>…</p>"; panel.classList.add("on"); panel.setAttribute("aria-hidden","false"); hint.classList.remove("on");
  panelBody.innerHTML=await sectionHTML(sec.key==="writing"?"writing":sec.key);
  if(sec.key==="writing") panelBody.insertAdjacentHTML("beforeend","<p><a href='/writing/'>All essays</a></p>");
}
function hidePanel(){ panel.classList.remove("on"); panel.setAttribute("aria-hidden","true"); hint.classList.add("on"); }
controls=makeControls(camera,canvas,room.screens,label,{onFocus:showPanel,onBlur:hidePanel});
$("panel-back").addEventListener("click",()=>controls.blur());
document.querySelectorAll("nav [data-key]").forEach(a=>a.addEventListener("click",e=>{ e.preventDefault(); controls.focusKey(a.dataset.key); }));

/* first frame, then open */
controls.update(0,0); composer.render(); setPct(100);
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
setTimeout(open,reduced?0:250);
document.addEventListener("visibilitychange",()=>{ if(document.hidden){ running=false; } else if(!running){ running=true; requestAnimationFrame(t=>{ last=t/1000; frame(t); }); } });
