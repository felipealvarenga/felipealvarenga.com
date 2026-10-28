// Screen content: canvas textures drawn from the real record, ticking slowly so the room feels alive.
import * as THREE from "three";

export const SECTIONS=[
  {key:"ai",href:"/#ai",name:"AI work",tint:"#8fd3b0",
   lines:f=>[`PR #${1900+(f%60)} merged by the pipeline`,"reviewer: sandbox probe passed","15 Slack agents, 5 functions","59% of 2026 PRs are mine"],chart:[196,371,346,360,725],caption:"merged PRs per quarter"},
  {key:"work",href:"/#work",name:"Work",tint:"#9ab7ff",
   lines:f=>["Bags, Sr Staff, 2024 to now","Hubla, Provi, Iperum","Vety, founder, 350 vets","BTG Pactual, trading systems"],chart:[2,3,4,6,9],caption:"twenty years"},
  {key:"writing",href:"/writing/",name:"Writing",tint:"#f0c987",
   lines:f=>["essay 1, live","What breaks when an AI","reads a bank statement","next: agents and the 75%"],chart:[1,0,0,0,1],caption:"essays"},
  {key:"press",href:"/#press",name:"Press",tint:"#f29b9b",
   lines:f=>["interviews, EN and PT","AI in accounting","agent-run engineering","felipealvarengarc@gmail.com"],chart:null,caption:""},
];
export const AGENTS=["tax","sales","ops","funding","reviewer","sentry","cfo chat","memory"];
const STATES=["idle, waiting on queue","running, 2 tool calls","ok, merged","ok, replied in #ops","review, 1 finding","ok, preview up"];

export function makeScreen(title,linesFn,chart,tint,seed=0,caption=""){
  const c=document.createElement("canvas"); c.width=768; c.height=480; const g=c.getContext("2d");
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8;
  let frame=seed;
  function draw(){
    g.fillStyle="#0a0c10"; g.fillRect(0,0,768,480);
    g.strokeStyle="rgba(255,255,255,.05)"; for(let y=36;y<480;y+=36){ g.beginPath(); g.moveTo(0,y); g.lineTo(768,y); g.stroke(); }
    g.fillStyle=tint; g.font="500 30px ui-monospace, Menlo, monospace"; g.fillText(title.toUpperCase(),40,62);
    g.fillStyle="#e6e8ec"; g.font="27px ui-monospace, Menlo, monospace";
    linesFn(frame).forEach((l,i)=>g.fillText(l,40,130+i*46));
    if(chart){ const mx=Math.max(...chart,1); chart.forEach((v,i)=>{ const h=Math.round(v/mx*110); g.fillStyle=i===chart.length-1?tint:"rgba(230,232,236,.28)"; g.fillRect(40+i*70,440-h,50,h); }); g.fillStyle="rgba(230,232,236,.5)"; g.font="20px ui-monospace, Menlo, monospace"; g.fillText(caption,420,436); }
    else { g.fillStyle="rgba(230,232,236,.22)"; for(let i=0;i<28;i++){ const h=8+((i*37+frame*7+seed*13)%40); g.fillRect(40+i*25,440-h,16,h); } }
    const on=(frame+seed)%7!==3; g.fillStyle=on?tint:"#333843"; g.beginPath(); g.arc(720,52,8,0,Math.PI*2); g.fill();
    const grad=g.createRadialGradient(384,240,120,384,240,520); grad.addColorStop(0,"rgba(0,0,0,0)"); grad.addColorStop(1,"rgba(0,0,0,.4)"); g.fillStyle=grad; g.fillRect(0,0,768,480);
    tex.needsUpdate=true;
  }
  draw();
  return {texture:tex,tick(){ frame++; draw(); }};
}

export function agentScreen(i){
  const name=AGENTS[i%AGENTS.length];
  return makeScreen(name,f=>{ const s=STATES[(f+i)%STATES.length]; return [s,`last run ${(3+i*7+f*2)%59}m ago`,`queue ${(i*3+f)%5}`]; },null,"#9aa0ab",i);
}
