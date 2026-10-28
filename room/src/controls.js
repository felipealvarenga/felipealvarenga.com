// Camera rig: a three-quarter seat in the room, slow breathing, drag to look, pointer parallax,
// and focus flights: click a screen and the camera goes to it; back returns home.
import * as THREE from "three";

const ease=t=>1-Math.pow(1-t,5);
export function makeControls(camera,canvas,screens,label,{onFocus,onBlur}){
  const home={pos:new THREE.Vector3(1.9,1.75,3.6),look:new THREE.Vector3(-.3,1.4,-3.5)};
  const ray=new THREE.Raycaster(), ptr=new THREE.Vector2(9,9);
  let hovered=null, dragging=false, px=0,py=0, yaw=0,pitch=0, tyaw=0,tpitch=0, parx=0,pary=0;
  let focused=null, flight=null; const cur={pos:home.pos.clone(),look:home.look.clone()};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function fly(to,ms=900){ flight={from:{pos:cur.pos.clone(),look:cur.look.clone()},to,start:performance.now(),ms}; }
  function focus(mesh){
    const sec=mesh.userData.sec; if(!sec) return;
    const p=mesh.position.clone(), tanH=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2), portrait=camera.aspect<1;
    // the panel takes the right 30% on desktop (bottom 70% on phones), so park the screen in the free part of the view
    const dist=portrait? mesh.userData.w*1.1/(2*tanH*camera.aspect) : mesh.userData.h/0.62/(2*tanH);
    const halfW=dist*tanH*camera.aspect, halfH=dist*tanH;
    const ox=portrait?0:halfW*.3, oy=portrait?-halfH*.4:0;
    fly({pos:new THREE.Vector3(p.x+ox,p.y+oy,p.z+dist),look:new THREE.Vector3(p.x+ox,p.y+oy,p.z)});
    focused=mesh; tyaw=tpitch=0; onFocus(sec,mesh);
  }
  function blur(){ if(!focused) return; focused=null; fly({pos:home.pos.clone(),look:home.look.clone()},800); onBlur(); }
  canvas.addEventListener("pointermove",e=>{
    ptr.x=e.clientX/innerWidth*2-1; ptr.y=-(e.clientY/innerHeight)*2+1; label.style.left=e.clientX+"px"; label.style.top=e.clientY+"px";
    if(dragging&&!focused){ tyaw=clamp(tyaw+(e.clientX-px)*.0032,-.6,.6); tpitch=clamp(tpitch+(e.clientY-py)*.0022,-.2,.25); px=e.clientX; py=e.clientY; }
    else if(!focused){ parx=ptr.x*.05; pary=ptr.y*.025; }
  });
  canvas.addEventListener("pointerdown",e=>{ dragging=true; px=e.clientX; py=e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointerup",e=>{ const moved=Math.hypot(e.clientX-px,e.clientY-py)>6; dragging=false; if(moved) return; if(hovered&&hovered.userData.sec&&hovered!==focused) focus(hovered); else if(focused&&!hovered) blur(); });
  addEventListener("keydown",e=>{ if(e.key==="Escape"){ if(focused) blur(); else location.href="/?lofi=1"; } const map={"1":0,"2":1,"3":2,"4":3}; if(map[e.key]!==undefined){ const s=screens.filter(x=>x.userData.sec)[map[e.key]]; if(s) focus(s); } });
  return {
    focus, blur, focusKey(key){ const s=screens.find(x=>x.userData.sec&&x.userData.sec.key===key); if(s) focus(s); },
    get focused(){ return focused; },
    update(t,dt){
      yaw+=(tyaw+parx-yaw)*Math.min(1,dt*4); pitch+=(tpitch+pary-pitch)*Math.min(1,dt*4);
      const breathe=Math.sin(t*.45)*.01;
      if(flight){ const k=ease(Math.min(1,(performance.now()-flight.start)/flight.ms)); cur.pos.lerpVectors(flight.from.pos,flight.to.pos,k); cur.look.lerpVectors(flight.from.look,flight.to.look,k); if(k>=1) flight=null; }
      if(focused){ camera.position.set(cur.pos.x+parx*.15,cur.pos.y+pary*.1+breathe*.3,cur.pos.z); camera.lookAt(cur.look); }
      else {
        camera.position.set(cur.pos.x+Math.sin(yaw)*1.4, cur.pos.y+pitch*.9+breathe, cur.pos.z-(1-Math.cos(yaw))*1.4);
        camera.lookAt(cur.look.x+yaw*2.2, cur.look.y+pitch*2.4+breathe, cur.look.z);
      }
      ray.setFromCamera(ptr,camera); const hit=ray.intersectObjects(screens,false)[0]; const h=hit?hit.object:null;
      if(h!==hovered){
        if(hovered){ hovered.scale.setScalar(1); hovered.material.emissiveIntensity=hovered.userData.sec?1.5:.8; }
        hovered=h;
        if(h&&h.userData.sec&&h!==focused){ h.scale.setScalar(1.02); h.material.emissiveIntensity=2.0; label.textContent="open "+h.userData.sec.name; label.classList.add("on"); canvas.style.cursor="pointer"; }
        else { label.classList.remove("on"); canvas.style.cursor=focused?"default":(dragging?"grabbing":"grab"); }
      }
    }
  };
}
