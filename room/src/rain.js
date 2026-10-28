// A window at night with rain running down the glass. One plane, one shader, no textures.
import * as THREE from "three";

export function makeWindow(w,h){
  const uniforms={uTime:{value:0},uRes:{value:new THREE.Vector2(w,h)}};
  const mat=new THREE.ShaderMaterial({
    uniforms,transparent:false,
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:`
      precision highp float; varying vec2 vUv; uniform float uTime; uniform vec2 uRes;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      void main(){
        vec2 uv=vUv; vec2 px=uv*uRes;
        // night outside: deep blue sky, a mountain line, scattered lights
        float sky=smoothstep(0.0,1.0,uv.y);
        vec3 col=mix(vec3(0.02,0.03,0.06),vec3(0.05,0.08,0.16),sky);
        float ridge=0.32+0.08*noise(vec2(uv.x*3.0,0.0))+0.03*noise(vec2(uv.x*11.0,2.0));
        if(uv.y<ridge){ col=vec3(0.015,0.02,0.03); float l=step(0.985,hash(floor(px/vec2(9.0,5.0)))); col+=l*vec3(0.9,0.75,0.45)*(0.6+0.4*sin(uTime*2.0+px.x)); }
        // rain streaks: columns of drops falling at different speeds
        float streak=0.0;
        for(int k=0;k<3;k++){ float fk=float(k); vec2 g=vec2(uv.x*(40.0+fk*17.0), uv.y*2.0+uTime*(0.25+fk*0.12)); vec2 id=floor(g); float r=hash(id+fk); float d=abs(fract(g.x)-0.5); float y=fract(g.y+r); streak+=step(r,0.35)*smoothstep(0.06,0.0,d)*smoothstep(0.0,0.08,y)*smoothstep(0.5,0.1,y); }
        // static drops
        vec2 dg=uv*vec2(28.0,20.0); vec2 did=floor(dg); float dr=hash(did*1.7); vec2 dc=fract(dg)-0.5-(vec2(hash(did),hash(did+3.0))-0.5)*0.6; float drop=step(dr,0.22)*smoothstep(0.09,0.03,length(dc));
        float wet=clamp(streak*0.9+drop,0.0,1.0);
        // refraction-ish brightening and a glass tint
        col=mix(col,col*1.9+vec3(0.08,0.1,0.14),wet);
        col+=0.015*noise(px*0.05+uTime*0.1);
        gl_FragColor=vec4(col,1.0);
      }`
  });
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
  return {mesh,update(t){ uniforms.uTime.value=t; }};
}
