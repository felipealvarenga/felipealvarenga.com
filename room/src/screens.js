// Screen content: canvas textures drawn from the real record, ticking slowly so the room feels alive.
import * as THREE from "three";

export const SECTIONS=[
  {key:"ai",href:"/#ai",name:"AI work",tint:"#8fd3b0",
   lines:()=>[`heisenbags  PR #${1900+Math.floor(Date.now()/9e4)%60} merged`,"review: sandbox probe passed","15 agents · 5 functions","PRs/quarter 196 → 725"],chart:[196,371,346,360,725]},
  {key:"work",href:"/#work",name:"Work",tint:"#9ab7ff",
   lines:()=>["Bags · Sr Staff · 2024–now","Hubla · Provi · Iperum","Vety · BTG Pactual","twenty years of money"],chart:[2,3,4,6,9]},
  {key:"writing",href:"/writing/",name:"Writing",tint:"#f0c987",
   lines:()=>["essay 1 · live","what breaks when an AI","reads a bank statement","0 of 24 running balances"],chart:[1,0,0,0,1]},
  {key:"press",href:"/#press",name:"Press",tint:"#f29b9b",
   lines:()=>["interviews · EN / PT","AI in accounting","agent-run teams","felipealvarengarc@gmail.com"],chart:[1,1,2,2,3]},
];
export const AGENTS=["tax","sales","ops","funding","marketing","sentry intake","preview bot","reviewer","classifier","cfo chat","doc review","insights","memory","maestro","council"];
const STATES=["idle · waiting on queue","running · 2 tool calls","ok · merged","ok · replied in #ops","review · 1 finding","ok · preview up"];

export function makeScreen(title,linesFn,chart,tint,seed=0){
  const c=document.createElement("canvas"); c.width=512; c.height=320; const g=c.getContext("2d");
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4;
  let frame=seed;
  function draw(){
    g.fillStyle="#090b0f"; g.fillRect(0,0,512,320);
    g.strokeStyle="rgba(255,255,255,.06)"; for(let y=24;y<320;y+=24){ g.beginPath(); g.moveTo(0,y); g.lineTo(512,y); g.stroke(); }
    g.fillStyle=tint; g.font="500 22px ui-monospace, Menlo, monospace"; g.fillText(title.toUpperCase(),24,40);
    g.fillStyle="#d9dbe0"; g.font="18px ui-monospace, Menlo, monospace";
    const lines=linesFn(frame); lines.forEach((l,i)=>g.fillText(l,24,84+i*30));
    if(chart){ const mx=Math.max(...chart,1); chart.forEach((v,i)=>{ const h=Math.round(v/mx*80); g.fillStyle=i===chart.length-1?tint:"rgba(217,219,224,.3)"; g.fillRect(24+i*52,290-h,36,h); }); }
    else { g.fillStyle="rgba(217,219,224,.25)"; for(let i=0;i<24;i++){ const h=6+((i*37+frame*7+seed*13)%26); g.fillRect(24+i*19,292-h,12,h); } }
    const on=(frame+seed)%7!==3; g.fillStyle=on?tint:"#333843"; g.beginPath(); g.arc(480,36,6,0,Math.PI*2); g.fill();
    // scanline + vignette
    const grad=g.createRadialGradient(256,160,80,256,160,340); grad.addColorStop(0,"rgba(0,0,0,0)"); grad.addColorStop(1,"rgba(0,0,0,.45)"); g.fillStyle=grad; g.fillRect(0,0,512,320);
    tex.needsUpdate=true;
  }
  draw();
  return {texture:tex,tick(){ frame++; draw(); }};
}

export function agentScreen(i){
  const name=AGENTS[i%AGENTS.length];
  return makeScreen(name,f=>{ const s=STATES[(f+i)%STATES.length]; return [s,`last run ${(3+i*7+f*2)%59}m ago`,`queue ${(i*3+f)%5}`]; },null,"#8b9099",i);
}
