// Camera rig: a seat behind the desk, slow breathing, drag to look, pointer parallax, hotspots on the big screens.
import * as THREE from "three";

export function makeControls(camera,canvas,screens,label,onOpen){
  const home=new THREE.Vector3(.35,1.85,3.7), look=new THREE.Vector3(0,1.45,-3.5);
  const ray=new THREE.Raycaster(), ptr=new THREE.Vector2(9,9);
  let hovered=null, dragging=false, px=0,py=0, yaw=0,pitch=0, tyaw=0,tpitch=0, parx=0,pary=0;
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  canvas.addEventListener("pointermove",e=>{
    ptr.x=e.clientX/innerWidth*2-1; ptr.y=-(e.clientY/innerHeight)*2+1; label.style.left=e.clientX+"px"; label.style.top=e.clientY+"px";
    if(dragging){ tyaw=clamp(tyaw+(e.clientX-px)*.0032,-.7,.7); tpitch=clamp(tpitch+(e.clientY-py)*.0022,-.22,.28); px=e.clientX; py=e.clientY; }
    else { parx=ptr.x*.06; pary=ptr.y*.03; }
  });
  canvas.addEventListener("pointerdown",e=>{ dragging=true; px=e.clientX; py=e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointerup",e=>{ const moved=Math.hypot(e.clientX-px,e.clientY-py)>6; dragging=false; if(!moved&&hovered&&hovered.userData.sec) onOpen(hovered.userData.sec); });
  addEventListener("keydown",e=>{ if(e.key==="Escape") location.href="/?lofi=1"; const map={"1":0,"2":1,"3":2,"4":3}; if(map[e.key]!==undefined){ const s=screens.filter(x=>x.userData.sec)[map[e.key]]; if(s) onOpen(s.userData.sec); } });
  return {
    update(t,dt){
      yaw+=(tyaw+parx-yaw)*Math.min(1,dt*4); pitch+=(tpitch+pary-pitch)*Math.min(1,dt*4);
      const breathe=Math.sin(t*.45)*.012;
      camera.position.set(home.x+Math.sin(yaw)*1.4, home.y+pitch*.9+breathe, home.z-(1-Math.cos(yaw))*1.4);
      camera.lookAt(look.x+yaw*2.2, look.y+pitch*2.4+breathe, look.z);
      ray.setFromCamera(ptr,camera); const hit=ray.intersectObjects(screens,false)[0]; const h=hit?hit.object:null;
      if(h!==hovered){
        if(hovered){ hovered.scale.setScalar(1); hovered.material.emissiveIntensity=hovered.userData.sec?1.35:.75; }
        hovered=h;
        if(h&&h.userData.sec){ h.scale.setScalar(1.03); h.material.emissiveIntensity=1.9; label.textContent="open "+h.userData.sec.name; label.classList.add("on"); canvas.style.cursor="pointer"; }
        else { label.classList.remove("on"); canvas.style.cursor=dragging?"grabbing":"grab"; }
      }
    }
  };
}
