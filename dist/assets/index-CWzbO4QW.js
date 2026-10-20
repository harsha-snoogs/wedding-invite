(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`,t=`
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
uniform vec4 u_rect0;
uniform vec4 u_rect1;
uniform vec4 u_lay1;      // alpha, unused, edge-extension weight, enabled
uniform vec2 u_feather1;  // feather width in layer UVs
uniform vec4 u_tone0;     // rgb gain, saturation
uniform vec4 u_tone1;
uniform vec3 u_blur;      // centre (screen uv), strength
uniform float u_vignette;
uniform float u_seed;
uniform float u_lod;      // 1.0 when mipmaps exist

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec3 tone(vec3 c, vec4 t) {
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(l), c, t.a) * t.rgb;
}

// Inside the photo: a normal sample. Outside it (wide screens with tall photos): a mirrored,
// heavily blurred continuation, warmed towards sandalwood rather than darkened to black.
vec3 photo(sampler2D tex, vec2 uv) {
  vec2 o = max(-uv, uv - 1.0);
  float d = max(max(o.x, o.y), 0.0);
  float outside = step(1e-5, d);
  vec2 m = 1.0 - abs(1.0 - mod(uv, 2.0));
  // The mirror continues the picture exactly at the edge, so ramp blur and shade in from
  // zero there - no visible boundary.
  float bias = u_lod * outside * mix(1.0, 7.5, smoothstep(0.0, 0.045, d));
  vec3 c = texture2D(tex, m, bias).rgb;
  vec3 warm = mix(c * vec3(0.95, 0.85, 0.74), vec3(0.93, 0.85, 0.7), 0.25);
  return mix(c, warm, smoothstep(0.0, 0.22, d) * outside);
}

vec3 composite(vec2 suv) {
  vec3 c = tone(photo(u_tex0, (suv - u_rect0.xy) / u_rect0.zw), u_tone0);
  if (u_lay1.w > 0.5) {
    vec2 uv = (suv - u_rect1.xy) / u_rect1.zw;
    vec2 e = smoothstep(vec2(0.0), u_feather1, uv) * smoothstep(vec2(0.0), u_feather1, 1.0 - uv);
    float a = u_lay1.x * mix(e.x * e.y, 1.0, u_lay1.z);
    c = mix(c, tone(photo(u_tex1, uv), u_tone1), a);
  }
  return c;
}

void main() {
  vec2 suv = v_uv;
  float n = hash(gl_FragCoord.xy + u_seed);
  vec3 col;
  if (u_blur.z > 0.0005) {
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 10; i++) {
      float k = (float(i) + n) / 10.0;
      acc += composite(u_blur.xy + (suv - u_blur.xy) * (1.0 - u_blur.z * k));
    }
    col = acc / 10.0;
  } else {
    col = composite(suv);
  }

  // Shared grade so every photo feels like part of one film.
  col = clamp(col, 0.0, 1.0);
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.14);
  col += vec3(0.014, 0.007, 0.0) * (1.0 - col);

  // Vignette shades the corners towards a warm red-brown, never to black.
  float vd = length((suv - 0.5) * 2.0);
  col = mix(col, col * vec3(0.74, 0.52, 0.44), u_vignette * smoothstep(0.45, 1.45, vd));
  col += (n - 0.5) * 0.03;

  gl_FragColor = vec4(col, 1.0);
}`,n=class{constructor(e,{preserveDrawingBuffer:t=!1}={}){this.canvas=e,this.images=[],this.textures=[],this.W=1,this.H=1,this.scale=1;let n={alpha:!1,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!1,powerPreference:`high-performance`,preserveDrawingBuffer:t};this.gl=e.getContext(`webgl2`,n)||e.getContext(`webgl`,n),this.isWebGL2=typeof WebGL2RenderingContext<`u`&&this.gl instanceof WebGL2RenderingContext,this.gl?(this.initGL(),e.addEventListener(`webglcontextlost`,e=>e.preventDefault()),e.addEventListener(`webglcontextrestored`,()=>{this.textures=[],this.initGL(),this.images.forEach((e,t)=>e&&this.upload(t,e)),this.onRestore?.()})):this.ctx=e.getContext(`2d`),this.resize()}initGL(){let n=this.gl,r=(e,t)=>{let r=n.createShader(e);if(n.shaderSource(r,t),n.compileShader(r),!n.getShaderParameter(r,n.COMPILE_STATUS))throw Error(n.getShaderInfoLog(r));return r},i=n.createProgram();if(n.attachShader(i,r(n.VERTEX_SHADER,e)),n.attachShader(i,r(n.FRAGMENT_SHADER,t)),n.linkProgram(i),!n.getProgramParameter(i,n.LINK_STATUS))throw Error(n.getProgramInfoLog(i));n.useProgram(i),this.prog=i;let a=n.createBuffer();n.bindBuffer(n.ARRAY_BUFFER,a),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),n.STATIC_DRAW);let o=n.getAttribLocation(i,`a_pos`);n.enableVertexAttribArray(o),n.vertexAttribPointer(o,2,n.FLOAT,!1,0,0),this.u={},[`u_tex0`,`u_tex1`,`u_rect0`,`u_rect1`,`u_lay1`,`u_feather1`,`u_tone0`,`u_tone1`,`u_blur`,`u_vignette`,`u_seed`,`u_lod`].forEach(e=>{this.u[e]=n.getUniformLocation(i,e)}),n.uniform1i(this.u.u_tex0,0),n.uniform1i(this.u.u_tex1,1),n.uniform1f(this.u.u_lod,+!!this.isWebGL2)}addFrame(e,t){this.images[e]=t,this.gl&&this.upload(e,t)}upload(e,t){let n=this.gl,r=n.createTexture();n.bindTexture(n.TEXTURE_2D,r),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.texImage2D(n.TEXTURE_2D,0,n.RGBA,n.RGBA,n.UNSIGNED_BYTE,t),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,n.LINEAR),this.isWebGL2?(n.generateMipmap(n.TEXTURE_2D),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR_MIPMAP_LINEAR)):n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),this.textures[e]=r}hasFrame(e){return!!this.images[e]}resize(){let e=this.canvas.clientWidth||window.innerWidth,t=this.canvas.clientHeight||window.innerHeight,n=Math.min(window.devicePixelRatio||1,2,Math.sqrt(24e5/(e*t))),r=Math.round(e*n),i=Math.round(t*n),a=r!==this.canvas.width||i!==this.canvas.height||e!==this.W||t!==this.H;return this.W=e,this.H=t,this.scale=n,a&&(this.canvas.width=r,this.canvas.height=i),a}render(e,t){if(!this.gl)return this.render2d(e);let n=this.gl,r=this.u,{W:i,H:a}=this,[o,s]=e.layers;if(!this.textures[o.frame])return;n.viewport(0,0,this.canvas.width,this.canvas.height),n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,this.textures[o.frame]),n.uniform4f(r.u_rect0,o.rect.x/i,o.rect.y/a,o.rect.w/i,o.rect.h/a),n.uniform4fv(r.u_tone0,o.tone);let c=s&&this.textures[s.frame]&&s.alpha>.001;if(n.activeTexture(n.TEXTURE1),n.bindTexture(n.TEXTURE_2D,this.textures[c?s.frame:o.frame]),c){let e=s.rect,t=Math.min(e.w,e.h)*s.feather;n.uniform4f(r.u_rect1,e.x/i,e.y/a,e.w/i,e.h/a),n.uniform4f(r.u_lay1,s.alpha,0,s.ext,1),n.uniform2f(r.u_feather1,Math.max(t/e.w,1e-4),Math.max(t/e.h,1e-4)),n.uniform4fv(r.u_tone1,s.tone)}else n.uniform4f(r.u_lay1,0,0,0,0);let[l,u]=e.blurCenter,d=Math.min(1.6,Math.max(-.6,l/i)),f=Math.min(1.6,Math.max(-.6,u/a));n.uniform3f(r.u_blur,d,f,t),n.uniform1f(r.u_vignette,e.vignette),n.uniform1f(r.u_seed,performance.now()%1e3*.13),n.drawArrays(n.TRIANGLES,0,3)}render2d(e){let t=this.ctx;if(!t)return;let n=this.scale;t.setTransform(1,0,0,1,0,0),t.fillStyle=`#3e0d16`,t.fillRect(0,0,this.canvas.width,this.canvas.height),e.layers.forEach((e,r)=>{let i=this.images[e.frame];i&&(t.globalAlpha=r===0?1:e.alpha,t.drawImage(i,e.rect.x*n,e.rect.y*n,e.rect.w*n,e.rect.h*n))}),t.globalAlpha=1}},r=`/assets/film/`,i=[{src:`01-opening`,w:896,h:1200},{src:`02-hands`,w:1024,h:1024},{src:`03-face-other`,w:1326,h:1186,show:.66}].map(e=>({...e,avif:`${r}${e.src}.avif`,jpg:`${r}${e.src}.jpg`})),a={x:.5,y:.5,z:1},o=[{dir:`in`,p:[.528,.82],q:[.56,.56],k:.26,at:[.5,.6],z:1.15},{dir:`out`,p:[.525,.6],q:[.56,.56],k:.14,at:[.5,.8],z:1.15}],s=[{len:.5,push:1.06,at:[.53,.8]},{len:.6},{len:2.8,at:[.5,.9],z:1}],c=1.025,l=[1.25,1.7],u=(()=>{let e=[],t=0;return i.forEach((n,r)=>{e.push({kind:`hold`,i:r,start:t,len:s[r].len}),t+=s[r].len,r<o.length&&(e.push({kind:`link`,i:r,start:t,len:l[r]}),t+=l[r])}),e})(),d=u[u.length-1].start+u[u.length-1].len;function f(e){return u.find(t=>t.kind===`hold`&&t.i===e).start}function p(e){return s[e].len}var m=(e,t,n)=>Math.min(n,Math.max(t,e)),h=(e,t,n)=>{let r=m((n-e)/(t-e),0,1);return r*r*(3-2*r)},g=e=>e*e*(3-2*e),_=.22,v=1.6;function y(e,t,n){let r=e.w/e.h,i=t/n,a=i>r?t:n*r,o=i>r?n*r:t;return i<1?e.show?Math.min(a,t/e.show):a:Math.min(a,o*v)}function b(e,t,n){return[e.w>=t?m(e.x,t-e.w,0)-e.x:(t-e.w)/2-e.x,e.h>=n?m(e.y,n-e.h,0)-e.y:(n-e.h)/2-e.y]}var x=(e,[t,n])=>({x:e.x+t,y:e.y+n,w:e.w,h:e.h}),S=(e,t)=>[e.x+t[0]*e.w,e.y+t[1]*e.h];function C(e,t,n,r){return{x:n[0]+r*(e.x-t[0]),y:n[1]+r*(e.y-t[1]),w:e.w*r,h:e.h*r}}function w(e,t,n){let r=e.w*t.k,i=r*n.h/n.w;return{x:e.x+t.p[0]*e.w-t.q[0]*r,y:e.y+t.p[1]*e.h-t.q[1]*i,w:r,h:i}}function T(e,t,n){let r=e.w/t.k,i=r*n.h/n.w;return{x:e.x+t.q[0]*e.w-t.p[0]*r,y:e.y+t.q[1]*e.h-t.p[1]*i,w:r,h:i}}function E(e,t){let{dir:n,p:r,q:i}=o[t];return e===(n===`in`?t:t+1)?r:i}function D(e,t){let n=[],r=i[0],l=y(r,e,t)*a.z,d={x:e/2-a.x*l,y:t/2-a.y*(l*r.h)/r.w,w:l,h:l*r.h/r.w};d=x(d,b(d,e,t));for(let r of u){let a=r.i;if(r.kind===`hold`){let l=s[a],u=a<o.length?E(a,a):E(a,a-1),f=S(d,u),p=l.z?y(i[a],e,t)*l.z/d.w:l.push||c,m=l.at?[l.at[0]*e,l.at[1]*t]:f,h=b(C(d,f,m,p),e,t);m=[m[0]+h[0],m[1]+h[1]],n.push({seg:r,start:d,S0:f,S1:m,s:p}),d=C(d,f,m,p)}else{let s=o[a],c=i[a+1],l=S(d,E(a,a)),u=s.dir===`in`?w(d,s,c):T(d,s,c),f=y(c,e,t)*s.z/u.w,p=s.at?[s.at[0]*e,s.at[1]*t]:l,m=b(C(u,l,p,f),e,t);p=[p[0]+m[0],p[1]+m[1]],n.push({seg:r,start:d,bStart:u,S0:l,S1:p,s:f}),d=C(u,l,p,f)}}return n}var O={key:``,plan:null};function ee(e,t){let n=`${e}x${t}`;return O.key!==n&&(O={key:n,plan:D(e,t)}),O.plan}function te(e,t,n,r={}){e=m(e,0,d);let i=ee(t,n),a=i.length-1;for(let t=0;t<i.length;t++){let n=i[t].seg;if(e<n.start+n.len){a=t;break}}let s=i[a],c=s.seg,l=m((e-c.start)/c.len,0,1),u=g(l),f=c.kind===`link`?h(0,.7,l):u,p=[s.S0[0]+(s.S1[0]-s.S0[0])*f,s.S0[1]+(s.S1[1]-s.S0[1])*f],v=s.s**u,y={layers:[],blurCenter:p,baseBlur:0,vignette:.32,logZoom:0,t:l,seg:c};if(c.kind===`hold`){let e=C(s.start,s.S0,p,v);return e=x(e,b(e,t,n)),y.layers.push(k(c.i,e,1,0,1)),y.logZoom=Math.log(e.w),y}let S=c.i,w=c.i+1,T=o[c.i],E=C(s.start,s.S0,p,v),D=C(s.bStart,s.S0,p,v);if(r.reducedMotion){let e=C(s.bStart,s.S0,s.S1,s.s);E=ne(s.start,1.05**u),D=ne(e,1.05**(1-u)),y.layers.push(k(S,E,1,0,1)),y.layers.push(k(w,D,h(.12,.88,l),0,1)),y.logZoom=Math.log(E.w)}else{let e=b(T.dir===`in`?E:D,t,n);E=x(E,e),D=x(D,e),T.dir===`in`?(y.layers.push(k(S,E,1,0,1)),y.layers.push(k(w,D,h(.18,.78,l),_*(1-h(.55,.95,l)),h(.7,1,l))),y.logZoom=Math.log(E.w)):(y.layers.push(k(w,D,1,0,1)),y.layers.push(k(S,E,1-h(.22,.82,l),_*h(.04,.4,l),1-h(0,.28,l))),y.logZoom=Math.log(D.w)),y.baseBlur=.022*Math.sin(Math.PI*l)}if(T.night){let e=h(.05,.8,l),t=y.layers.find(e=>e.frame===S);t.tone=[1-.62*e,1-.55*e,1-.3*e,1-.45*e]}return y}function ne(e,t){let n=e.w*t,r=e.h*t;return{x:e.x-(n-e.w)/2,y:e.y-(r-e.h)/2,w:n,h:r}}function k(e,t,n,r,i){return{frame:e,rect:t,alpha:n,feather:r,ext:i,tone:[1,1,1,1]}}var re=(e,t,n)=>Math.min(n,Math.max(t,e)),ie=(e,t,n)=>{let r=re((n-e)/(t-e),0,1);return r*r*(3-2*r)},ae=class{constructor({engine:e,film:t,overlays:n=[],progressEl:r,reducedMotion:i=!1,onRender:a}){this.engine=e,this.onRender=a,this.film=t,this.overlays=n,this.progressEl=r,this.opts={reducedMotion:i},this.u=0,this.blur=0,this.speed=0,this.running=!1,this.dirty=!0,this.tick=this.tick.bind(this),this.measure(),window.addEventListener(`scroll`,()=>this.kick(),{passive:!0}),window.addEventListener(`resize`,()=>{this.measure(),this.invalidate()});let o=()=>{this.engine.resize()&&(this.measure(),this.invalidate())};window.ResizeObserver?new ResizeObserver(o).observe(e.canvas):window.addEventListener(`resize`,o),e.onRestore=()=>this.invalidate()}measure(){this.filmTop=this.film.offsetTop,this.filmScroll=Math.max(1,this.film.offsetHeight-window.innerHeight)}invalidate(){this.dirty=!0,this.kick()}maxU(){let e=i.findIndex((e,t)=>!this.engine.hasFrame(t));return e===-1?d:e===0?0:f(e-1)+p(e-1)}targetU(){let e=re((window.scrollY-this.filmTop)/this.filmScroll,0,1);return Math.min(e*d,this.maxU())}snap(){this.u=this.targetU(),this.invalidate()}kick(){this.running||(this.running=!0,this.last=performance.now(),requestAnimationFrame(this.tick))}tick(e){let t=re((e-this.last)/1e3,1/240,.05);this.last=e;let n=this.targetU(),r=this.u;this.u+=(n-this.u)*(1-Math.exp(-t/.085)),Math.abs(n-this.u)<2e-4&&(this.u=n);let{W:i,H:a}=this.engine,o=te(this.u,i,a,this.opts);if(this.u!==r){let e=te(r,i,a,this.opts);e.seg===o.seg&&(this.speed=Math.abs(o.logZoom-e.logZoom)/t/60)}else this.speed=0;let s=this.opts.reducedMotion?0:Math.min(.17,this.speed*2.6+o.baseBlur);this.blur+=(s-this.blur)*(1-Math.exp(-t/.07));let c=this.u===n&&Math.abs(this.blur-s)<.001;c&&(this.blur=s),(this.u!==r||this.dirty||this.blur!==this.lastBlur)&&(this.engine.render(o,this.blur),this.updateOverlays(this.u),this.onRender?.(o),this.lastBlur=this.blur,this.dirty=!1),c?this.running=!1:requestAnimationFrame(this.tick)}updateOverlays(e){this.progressEl&&(this.progressEl.style.transform=`scaleX(${(e/d).toFixed(4)})`);for(let t of this.overlays){let n=t.in?ie(t.in[0],t.in[1],e):1,r=t.out?ie(t.out[0],t.out[1],e):0,i=n*(1-r),a=Math.round(i*1e3)/1e3;a!==t.last&&(t.last=a,t.el.style.opacity=a,t.el.style.visibility=a>0?`visible`:`hidden`,t.el.style.setProperty(`--drift`,`${((1-n)*18-r*18).toFixed(2)}px`),t.el.style.setProperty(`--in`,n.toFixed(3)))}}},oe=`data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAE1pUHJhdmlmbWlhZm1pZjEAAAFebWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAAOcGl0bQAAAAAAAQAAADhpaW5mAAAAAAACAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAAFWluZmUCAAABAAIAAEV4aWYAAAAAGmlyZWYAAAAAAAAADmNkc2MAAgABAAEAAACBaXBycAAAAGBpcGNvAAAAE2NvbHJuY2x4AAIAAgAGgAAAAAxjbGxpAMsAQAAAABRpc3BlAAAAAAAAAAIAAAACAAAACWlyb3QAAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABlpcG1hAAAAAAAAAAEAAQaBAgMFhoQAAAAsaWxvYwAAAABEAAACAAEAAAABAAAB3AAAACsAAgAAAAEAAAGOAAAATgAAAAFtZGF0AAAAAAAAAIkAAAAGRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAqADAAQAAAABAAAAAgAAAAASAAoMAAAAAAZ//AgQEDQgMhkQAZIACCCCIAE47tM254GtvzFMnuEJ3QH0`;function se(){return new Promise(e=>{let t=new Image;t.onload=()=>e(t.width>0),t.onerror=()=>e(!1),t.src=oe})}function ce(e){return new Promise((t,n)=>{let r=new Image;r.decoding=`async`,r.onload=()=>{if(!r.decode||document.visibilityState===`hidden`)return t(r);let e=()=>t(r);Promise.race([r.decode(),new Promise(e=>setTimeout(e,1500))]).then(e,e)},r.onerror=()=>n(Error(`Failed to load ${e}`)),r.src=e})}function le(e,{onFrame:t,onProgress:n,firstCount:r=2,concurrency:i=3}){let a,o=new Promise(e=>a=e),s=0;return{ready:o,done:se().then(o=>{let c=0;return Promise.all(Array.from({length:i},async()=>{for(;c<e.length;){let i=c++,l=e[i],u;try{u=await ce(o?l.avif:l.jpg)}catch{u=await ce(l.jpg).catch(()=>null)}u&&t(i,u),i<r&&(s++,n?.(s/r),s===r&&a())}}))})}}var A=e=>String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]);function ue(e){return new Date(+e.slice(0,4),e.slice(4,6)-1,+e.slice(6,8))}function de(e){let t=/^([A-Za-z]+)\s+(\d{1,2})/.exec(e);return t?{day:t[2],mon:t[1].slice(0,3)}:{day:``,mon:e}}function fe(e){return`https://calendar.google.com/calendar/render?${new URLSearchParams({action:`TEMPLATE`,text:e.title,dates:`${e.startDate}/${e.endDate}`,details:e.description,location:e.location,ctz:`Asia/Kolkata`})}`}var j=`
  <svg class="ornament" viewBox="0 0 120 12" aria-hidden="true">
    <path d="M0 6h50M70 6h50" stroke="currentColor" stroke-width="0.75"/>
    <path d="M60 1l5 5-5 5-5-5z" fill="none" stroke="currentColor" stroke-width="0.75"/>
  </svg>`;function pe(e){let t=String(e||``).toLowerCase();return t.includes(`welcome`)?`
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M24 10c0 4-4 8-4 12 0 4 4 6 4 6s4-2 4-6c0-4-4-8-4-12z" />
        <path d="M24 28c-4 0-10-2-12-8 0 6 5 11 12 11s12-5 12-11c-2 6-8 8-12 8z" />
        <path d="M12 24c-3 1-5 4-5 7 0 5 6 9 17 9s17-4 17-9c0-3-2-6-5-7" />
        <path d="M24 6c0-2-2-4-2-4s-2 2-2 4c0 1.5 1 2 2 2s2-.5 2-2z" fill="currentColor" />
      </svg>`:t.includes(`engage`)||t.includes(`nitchayathartham`)?`
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="19" cy="27" r="9.5" />
        <circle cx="29" cy="27" r="9.5" />
        <path d="M24 13l2.5 3.5-2.5 3.5-2.5-3.5z" fill="currentColor" opacity="0.85" />
        <path d="M24 9v-3M20.5 8.5l-2-2M27.5 8.5l2-2" stroke-width="1.2" />
        <circle cx="24" cy="27" r="1.5" fill="currentColor" />
      </svg>`:t.includes(`reception`)?`
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M24 4v8" />
        <path d="M14 16c0 6 4 10 10 10s10-4 10-10H14z" />
        <path d="M10 16c0 10 6 16 14 16s14-6 14-16" />
        <path d="M18 20v6M24 20v8M30 20v6" />
        <circle cx="24" cy="40" r="2.5" fill="currentColor" />
        <circle cx="16" cy="35" r="1.8" fill="currentColor" />
        <circle cx="32" cy="35" r="1.8" fill="currentColor" />
        <path d="M6 10l2 2M42 10l-2 2M24 2l1 2h2l-2 1 1 2-2-1-2 1 1-2-2-1h2z" fill="currentColor" />
      </svg>`:t.includes(`upanayanam`)?`
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M13 41h22l4-7H9l4 7z" />
        <path d="M11 44h26" stroke-width="2" />
        <path d="M15 36c4-7 14-17 20-27" stroke-dasharray="2 2" stroke-width="1.7" />
        <path d="M13 38c4-7 14-17 20-27" stroke-dasharray="2 2" stroke-width="1.7" />
        <path d="M24 26c3.5-4 5.5-8 5.5-11 0-4-3.5-7-5.5-7s-5.5 3-5.5 7c0 3 2 7 5.5 11z" fill="currentColor" opacity="0.3" />
        <path d="M24 26c1.8-2 3-4 3-6 0-2-1.2-3.5-3-3.5s-3 1.5-3 3.5c0 2 1.2 4 3 6z" fill="currentColor" />
      </svg>`:`
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M15 19c0-5 4-8.5 9-8.5s9 3.5 9 8.5c0 7-9 13.5-9 13.5s-9-6.5-9-13.5z" />
      <path d="M24 6v4M19.5 8l2 2.5M28.5 8l-2 2.5" />
      <circle cx="24" cy="38" r="4.5" fill="currentColor" />
      <circle cx="17" cy="35" r="3" fill="currentColor" opacity="0.85" />
      <circle cx="31" cy="35" r="3" fill="currentColor" opacity="0.85" />
      <path d="M8 24c4.5 7 10 11 16 11s11.5-4 16-11" stroke-width="1.4" />
    </svg>`}function me(e,t){let{bride:n,groom:r,couple:i,wedding:a,functions:o,families:s,coimbatorePostcards:c=[]}=t,l=ue(a.calendarDetails.startDate);l.toLocaleDateString(`en-US`,{weekday:`long`}),l.toLocaleDateString(`en-US`,{month:`long`,year:`numeric`});let u=(e,t)=>`
    <article class="family reveal">
      <div class="family-arch"><img src="${A(e.photo||t.photo)}" alt="${A(e.title||t.fullName)}" loading="lazy" decoding="async"></div>
      <h3>${A(e.title)}</h3>
      <p class="family-sub">${A(e.subtitle)}</p>
      <ul>
        ${e.members.map(e=>`<li><span>${A(e.name)}</span></li>`).join(``)}
      </ul>
    </article>`;e.innerHTML=`
    <div class="details-inner">
      <header class="invite reveal">
        <p class="eyebrow">Together with their families</p>
        <h2 class="invite-names">${A(r.name)} <em>&amp;</em> ${A(n.name)}</h2>
        <p class="invite-line">request the joy of your presence at their wedding celebrations</p>
        
        <div class="invite-dates">
          <div class="invite-date-card">
            <span class="card-dow">Sunday</span>
            <span class="card-day">15</span>
            <span class="card-tag">Celebrations &amp; Reception</span>
          </div>
          <span class="invite-date-amp" aria-hidden="true">&amp;</span>
          <div class="invite-date-card card-muhurtham">
            <span class="card-dow">Monday</span>
            <span class="card-day">16</span>
            <span class="card-tag">Subha Muhurtham</span>
          </div>
        </div>
        <p class="invite-month">November 2026</p>

        <p class="invite-venue">${A(a.venue)}<span>${A(a.address)}, ${A(a.city)}</span></p>
        <div class="actions">
          <a class="btn btn-gold" href="${A(fe(a.calendarDetails))}" target="_blank" rel="noopener">Add to calendar</a>
        </div>
      </header>

      ${j}

      <!-- Celebrations section with luxury cards and slow perspective transitions -->
      <section class="events-section">
        <p class="eyebrow reveal">The Celebrations</p>
        <h3 class="events-section-title reveal">Sacred Ceremonies &amp; Festivities</h3>
        <p class="events-section-subtitle reveal">Join us as we step into our new journey across two joyful days</p>

        <div class="ceremony-cards-grid">
          ${o.map((e,t)=>{let n=/muhurtham/i.test(e.title)||e.type===`muhurtham`,r=de(e.date),i=pe(e.type||e.title),a=/15/.test(e.date)?`Sunday`:`Monday`;return`
            <div class="ceremony-card reveal-card ${n?`is-muhurtham-card`:``}" style="--card-index: ${t}">
              <div class="card-glass">
                ${e.bg?`
                <div class="card-bg-layer" aria-hidden="true">
                  <img src="${A(e.bg)}" alt="" loading="eager" decoding="async">
                  <div class="card-bg-gradient"></div>
                </div>`:``}
                ${n?`<div class="card-crown-badge">✦ Auspicious Subha Muhurtham ✦</div>`:``}
                <div class="card-header-bar">
                  <span class="card-date-badge"><span class="badge-dot"></span>${a}, ${A(r.day)} ${A(r.mon)}</span>
                  <span class="card-time-badge">${A(e.time)}</span>
                </div>
                <div class="card-motif-circle">
                  <div class="motif-icon">${i}</div>
                </div>
                <h4 class="card-event-title">${A(e.title)}</h4>
                <p class="card-event-desc">${A(e.description)}</p>
                <div class="card-decor-corner card-decor-tl" aria-hidden="true"></div>
                <div class="card-decor-corner card-decor-br" aria-hidden="true"></div>
              </div>
            </div>`}).join(``)}
        </div>
      </section>

      ${j}

      <section class="families">
        <p class="eyebrow reveal">With the blessings of</p>
        <div class="family-grid">
          ${u(s.bride,n)}
          ${u(s.groom,r)}
        </div>
      </section>

      ${j}

      <section class="venue reveal">
        <p class="eyebrow">The venue</p>
        <h3>${A(a.venue)}</h3>
        <p class="venue-address">${A(a.address)}, ${A(a.city)}</p>
        <a class="btn btn-ghost" href="${A(a.googleMapsUrl)}" target="_blank" rel="noopener">Open in Google Maps</a>
      </section>

      ${j}

      <!-- Postcards from Coimbatore (horizontally scrollable interactive cards) -->
      <section class="postcards-section reveal">
        <p class="eyebrow">Explore Kovai</p>
        <h3 class="postcards-title">Postcards from Coimbatore</h3>
        <p class="postcards-subtitle">Scenic landmarks &amp; sacred sanctuaries to visit during your stay</p>

        <div class="postcard-rail-wrapper">
          <div class="postcard-rail" id="postcard-rail" role="region" aria-label="Postcards from Coimbatore carousel">
            ${c.map(e=>`
              <article class="postcard-card" data-postcard-id="${A(e.id)}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="View details for ${A(e.title)}">
                <div class="postcard-inner">
                  <div class="postcard-stamp" aria-hidden="true">
                    <span class="stamp-pin">641001</span>
                    <span class="stamp-city">KOVAI</span>
                  </div>
                  <div class="postcard-photo-wrap">
                    <img src="${A(e.image)}" alt="${A(e.title)}" loading="lazy" decoding="async">
                    <span class="postcard-dist-pill">${A(e.distance.split(`·`)[0].trim())}</span>
                  </div>
                  <div class="postcard-caption">
                    <span class="postcard-category">${A(e.category)}</span>
                    <h4 class="postcard-place-title">${A(e.title)}</h4>
                    <p class="postcard-tagline">${A(e.tagline)}</p>
                    <div class="postcard-cta">
                      <span>Read story &amp; view map</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              </article>`).join(``)}
          </div>
        </div>
      </section>

      <footer class="closing reveal">
        <p class="closing-quote">${A(i.closingHeadline)}<br>${A(i.closingSubhead)}</p>
        <p class="closing-text">${A(i.invitationMessage)}</p>
        <p class="closing-mono">${A(i.monogram)}</p>
      </footer>
    </div>

    <!-- Interactive Postcard Modal Popup -->
    <div class="postcard-modal-overlay" id="postcard-modal-overlay" aria-hidden="true">
      <div class="postcard-modal" id="postcard-modal" role="dialog" aria-modal="true" aria-labelledby="modal-place-title">
        <div class="modal-drag-area" id="modal-drag-area" role="button" aria-label="Swipe down to close">
          <span class="modal-drag-bar" aria-hidden="true"></span>
        </div>
        <button class="modal-close-btn" id="modal-close-btn" type="button" aria-label="Close dialog">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-body" id="modal-body"></div>
      </div>
    </div>`;let d=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.classList.add(`is-in`),d.unobserve(e.target))})},{rootMargin:`0px 0px -8% 0px`});e.querySelectorAll(`.reveal`).forEach(e=>d.observe(e));let f=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.classList.add(`is-revealed`),f.unobserve(e.target))})},{rootMargin:`0px 0px -10% 0px`,threshold:.15});e.querySelectorAll(`.reveal-card`).forEach(e=>f.observe(e));let p=document.getElementById(`postcard-modal-overlay`),m=document.getElementById(`postcard-modal`),h=document.getElementById(`modal-body`),g=document.getElementById(`modal-close-btn`),_=document.getElementById(`modal-drag-area`);p&&p.parentElement!==document.body&&document.body.appendChild(p);function v(e){let t=c.find(t=>t.id===e);t&&p&&h&&m&&(m.scrollTop=0,m.style.transform=``,m.style.transition=``,h.innerHTML=`
      <div class="modal-hero-wrap">
        <img src="${A(t.image)}" alt="${A(t.title)}" class="modal-hero-img">
        <div class="modal-hero-overlay"></div>
        <span class="modal-category-badge">${A(t.category)}</span>
      </div>
      <div class="modal-content">
        <div class="modal-header-meta">
          <span class="modal-distance-pill">📍 ${A(t.distance)}</span>
          <span class="modal-time-pill">⏰ Best time: ${A(t.bestTime)}</span>
        </div>
        <h3 class="modal-title" id="modal-place-title">${A(t.title)}</h3>
        <p class="modal-tagline">${A(t.tagline)}</p>
        <p class="modal-desc">${A(t.description)}</p>
        
        <div class="modal-highlights">
          <span class="highlights-label">Experience highlights:</span>
          <ul class="highlights-list">
            ${t.highlights.map(e=>`<li><span class="check-icon">✦</span> ${A(e)}</li>`).join(``)}
          </ul>
        </div>

        <div class="modal-actions">
          <a class="btn btn-gold modal-map-btn" href="${A(t.mapsUrl)}" target="_blank" rel="noopener">
            <span>Open in Google Maps</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
          </a>
          <button type="button" class="btn btn-ghost modal-close-action-btn" id="modal-bottom-close">
            <span>Close</span>
          </button>
        </div>
      </div>`,h.querySelector(`#modal-bottom-close`)?.addEventListener(`click`,y),p.setAttribute(`aria-hidden`,`false`),document.body.classList.add(`modal-open`),g?.focus())}function y(){p&&m&&(m.style.transition=`transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)`,m.style.transform=`translateY(100%)`,setTimeout(()=>{p.setAttribute(`aria-hidden`,`true`),document.body.classList.remove(`modal-open`),m.style.transform=``,m.style.transition=``},240))}g?.addEventListener(`click`,y),_?.addEventListener(`click`,y),p?.addEventListener(`click`,e=>{e.target===p&&y()}),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&p?.getAttribute(`aria-hidden`)===`false`&&y()});let b=0,x=0,S=0,C=!1;function w(e){e.touches.length===1&&(b=e.touches[0].clientY,x=e.touches[0].clientX,S=0,C=!1)}function T(e){if(e.touches.length!==1||!m)return;let t=e.touches[0].clientY,n=e.touches[0].clientX,r=t-b,i=n-x,a=m.scrollTop<=0,o=e.target.closest(`#modal-drag-area, .modal-hero-wrap, .modal-close-btn`);(a||o)&&r>0&&Math.abs(r)>Math.abs(i)&&(C=!0,S=r,e.cancelable&&e.preventDefault(),m.style.transition=`none`,m.style.transform=`translateY(${Math.max(0,r)}px)`)}function E(){C&&m&&(C=!1,S>75?y():(m.style.transition=`transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)`,m.style.transform=`translateY(0)`,setTimeout(()=>{m&&(m.style.transition=``)},300)))}m&&(m.addEventListener(`touchstart`,w,{passive:!0}),m.addEventListener(`touchmove`,T,{passive:!1}),m.addEventListener(`touchend`,E,{passive:!0}),m.addEventListener(`touchcancel`,E,{passive:!0})),e.querySelectorAll(`.postcard-card`).forEach(e=>{let t=e.dataset.postcardId;e.addEventListener(`click`,()=>v(t)),e.addEventListener(`keydown`,e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),v(t))})})}var he=class{constructor({src:e=``,volume:t=1}={}){this.src=e,this.volume=t,this.playing=!1,document.addEventListener(`visibilitychange`,()=>this.onVisibility())}get available(){return!!this.src}preload(){this.src&&!this.el&&(this.el=new Audio(this.src),this.el.loop=!0,this.el.preload=`auto`,this.el.volume=0)}toggle(){return this.playing?Promise.resolve(this.stop()):this.start()}start(){if(this.preload(),!this.el)return Promise.resolve(!1);this.playing=!0;let e=this.el.play();return this.fade(this.volume,1500),Promise.resolve(e).then(()=>!0,()=>(this.playing=!1,!1))}stop(){return this.playing=!1,this.el&&this.fade(0,800,()=>this.el.pause()),!1}fade(e,t,n){cancelAnimationFrame(this.raf);let r=this.el,i=r.volume,a=performance.now(),o=s=>{let c=Math.min(1,(s-a)/t);r.volume=i+(e-i)*c,c<1?this.raf=requestAnimationFrame(o):n?.()};this.raf=requestAnimationFrame(o)}onVisibility(){this.el&&this.playing&&(document.hidden?this.el.pause():this.el.play().catch(()=>{}))}},M=32,N=64,ge=[10,8,6],P=(e,t,n)=>[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n],_e=e=>Math.min(1,Math.max(0,e)),ve=e=>`#`+e.map(e=>Math.round(Math.min(255,Math.max(0,e))/2)*2).map(e=>Math.min(255,e).toString(16).padStart(2,`0`)).join(``),ye=class{constructor({bg:e,details:t}){this.bg=e,this.details=t,this.maps=[],this.film={top:e,bottom:e},this.meta=document.querySelector(`meta[name="theme-color"]`),this.edgeTop=document.getElementById(`edge-top`),this.edgeBottom=document.getElementById(`edge-bottom`),this.last=``;let n=!1;window.addEventListener(`scroll`,()=>{n||(n=!0,requestAnimationFrame(()=>{n=!1,this.apply()}))},{passive:!0})}addFrame(e,t){let n=document.createElement(`canvas`);n.width=M,n.height=N;let r=n.getContext(`2d`,{willReadFrequently:!0});r.imageSmoothingEnabled=!0,r.imageSmoothingQuality=`high`,r.drawImage(t,0,0,M,N),this.maps[e]=r.getImageData(0,0,M,N).data}sample(e,t,n){let r=this.maps[e];if(!r)return null;let i=Math.max(-t,t-1,-n,n-1,0),a=1-Math.abs(1-(t%2+2)%2),o=1-Math.abs(1-(n%2+2)%2),s=Math.min(31,Math.max(0,a*M-.5)),c=Math.min(63,Math.max(0,o*N-.5)),l=Math.floor(s),u=Math.floor(c),d=Math.min(31,l+1),f=Math.min(63,u+1),p=s-l,m=c-u,h=(e,t)=>{let n=(t*M+e)*4;return[r[n],r[n+1],r[n+2]]},g=P(P(h(l,u),h(d,u),p),P(h(l,f),h(d,f),p),m);if(i>0){let e=P([g[0]*.95,g[1]*.85,g[2]*.74],[237,217,179],.25),t=_e(i/.22);g=P(g,e,t*t*(3-2*t))}return g}edge(e,t,n,r){let i=[0,0,0],a=0;for(let n=0;n<12;n++){let o=(n+.5)/12*t,s=null;e.layers.forEach((e,t)=>{let n=e.rect,i=(o-n.x)/n.w,a=(r-n.y)/n.h,c=this.sample(e.frame,i,a);if(!c)return;let[l,u,d,f]=e.tone;if(l!==1||u!==1||d!==1||f!==1){let e=.299*c[0]+.587*c[1]+.114*c[2];c=P([e,e,e],c,f),c=[c[0]*l,c[1]*u,c[2]*d]}if(t===0||!s){s=c;return}let p=Math.min(n.w,n.h)*e.feather,m=Math.max(p/n.w,1e-4),h=Math.max(p/n.h,1e-4),g=(e,t)=>{let n=_e(t/e);return n*n*(3-2*n)},_=g(m,i)*g(m,1-i)*g(h,a)*g(h,1-a);s=P(s,c,e.alpha*(_+(1-_)*e.ext))}),s&&(i[0]+=s[0],i[1]+=s[1],i[2]+=s[2],a++)}if(!a)return this.bg;let o=[i[0]/a,i[1]/a,i[2]/a].map((e,t)=>{let n=Math.min(1,e/255);return n+=(n*n*(3-2*n)-n)*.14,n+=[.014,.007,0][t]*(1-n),n*255}),s=e.vignette*.39;return o=P(o,[o[0]*.74,o[1]*.52,o[2]*.44],s),o}setFilm(e,t,n,r=[]){let i=this.edge(e,t,n,n*.02),a=this.edge(e,t,n,n*.98);for(let e of r)e.amount<=0||(e.edge===`top`?i=P(i,ge,e.amount):a=P(a,ge,e.amount));this.film={top:i,bottom:a},this.apply()}apply(){let e=this.film.top,t=this.film.bottom;if(!document.body.classList.contains(`is-ready`))e=t=this.bg;else if(this.details){let n=window.innerHeight,r=this.details.getBoundingClientRect().top,i=e=>{if(e<=0)return 0;let t=n/100;return e<22*t?.78*(e/(22*t)):e<42*t?.78+.22*((e-22*t)/(20*t)):1};e=P(e,this.bg,i(-r)),t=P(t,this.bg,i(n-r))}let n=ve(e),r=ve(t),i=n+r;i!==this.last&&(this.last=i,this.meta&&(this.meta.content=n),document.documentElement.style.backgroundColor=n,document.body.style.backgroundColor=n,this.edgeTop&&(this.edgeTop.style.backgroundColor=n),this.edgeBottom&&(this.edgeBottom.style.backgroundColor=r))}},F={bride:{name:`Snegha`,fullName:`Snegha`,photo:`/assets/couple/sneha-solo.jpg`},groom:{name:`Ashwin`,fullName:`Ashwin`,photo:`/assets/couple/ashwin-solo.jpg`},music:{src:`/assets/audio/love_bug_has_bitten_cut.MP3`},couple:{monogram:`S & A`,closingHeadline:`Every journey has a beginning.`,closingSubhead:`Ours brought us here.`,invitationMessage:`Please join us, celebrate with us, and bless us as we begin our forever.`},journey:[{frame:`02-hands`,label:`The first promise`,text:`A hand, held a little longer than it needed to be.`},{frame:`03-face-other`,label:`In Your Eyes 🤍`,text:`Then came the glances that said what words couldn't.`},{frame:`03-journey-start`,label:`Side by side`,text:`Then came the long walks, and the quiet ones too.`}],finaleLine:`Two paths, one journey`,wedding:{date:`November 15 & 16 - 2026`,auspiciousTime:`Muhurtham: 06:35 AM - 07:15 AM`,venue:`Sri Vasavi Mithra Mahal`,city:`Coimbatore`,address:`Royal Iswaryam hall, Perur road, Telungupalayam`,googleMapsUrl:`https://maps.app.goo.gl/sh1sDH243gJYEbyB8`,calendarDetails:{title:`Snegha & Ashwin Wedding`,description:`Join us to celebrate the wedding of Snegha and Ashwin!`,location:`Sri Vasavi Mithra Mahal, Coimbatore`,startDate:`20261115T000000`,endDate:`20261116T235959`}},functions:[{type:`welcome`,title:`Welcome`,date:`November 15, 2026`,time:`08:30 AM onwards`,bg:`/assets/occasions/welcome-bg.jpg`,description:`A heartfelt welcome to the groom’s family as both families come together to celebrate love, joy, and new beginnings.`},{type:`engagement`,title:`Nitchayathartham`,date:`November 15, 2026`,time:`11:00 AM onwards`,bg:`/assets/occasions/engagement-bg.jpg`,description:`A beautiful promise of togetherness, as two families unite to bless a new beginning.`},{type:`reception`,title:`Reception`,date:`November 15, 2026`,time:`06:30 PM onwards`,bg:`/assets/occasions/reception-bg.jpg`,description:`An evening of elegance and celebration, sharing our happiness with the people we love.`},{type:`upanayanam`,title:`Upanayanam`,date:`November 16, 2026`,time:`04:00 AM - 05:00 AM`,bg:`/assets/occasions/upanayanam-bg.jpg`,description:`A sacred rite of passage, marking the beginning of a spiritual journey filled with wisdom and blessings.`},{type:`muhurtham`,title:`Subha Muhurtham`,date:`November 16, 2026`,time:`06:35 AM to 07:15 AM`,bg:`/assets/occasions/muhurtham-bg.jpg`,description:`A sacred union blessed with love, happiness, and a lifetime of beautiful tomorrows.`}],coimbatorePostcards:[{id:`perur`,title:`Perur Pateeswarar Temple`,tagline:`1,500-Year-Old Chola Architectural Marvel`,category:`Ancient Temple & Heritage`,image:`/assets/coimbatore/perur.jpg`,distance:`3.5 km · 8 mins from Venue`,location:`Perur, Coimbatore (Right on Perur Road)`,bestTime:`Early Morning or Sunset (07:00 AM - 11:30 AM / 05:00 PM - 08:00 PM)`,description:`Located right on Perur Road just minutes from our wedding hall, this sacred 1,500-year-old temple built by Karikala Chola is renowned for its breathtaking Kanaka Sabha (Golden Hall). Intricate monolithic stone pillars depict Shiva's Ananda Tandava and celestial deities with unimaginable detail.`,highlights:[`Kanaka Sabha Carved Pillars`,`Sacred Noyyal River Ghat`,`Centuries of Chola Legacy`],mapsUrl:`https://maps.app.goo.gl/9Z3h7B5b6M1k8pYV6`},{id:`adiyogi`,title:`Adiyogi Shiva & Isha Yoga`,tagline:`World's Largest Bust Sculpture`,category:`Iconic & Spiritual Landmark`,image:`/assets/coimbatore/adiyogi.jpg`,distance:`28 km · 45 mins from Venue`,location:`Isha Yoga Center, Velliangiri Foothills`,bestTime:`Late Afternoon & Evening (05:00 PM - 08:00 PM)`,description:`Recognized by Guinness World Records, the awe-inspiring 112-foot bust of Adiyogi Shiva stands majestically framed by the mist-shrouded peaks of the Velliangiri mountain range. Don't miss the spellbinding Divya Darshanam 3D laser projection show every evening at 7:00 PM.`,highlights:[`112-ft Adiyogi Statue`,`Dhyanalinga & Theerthakund`,`Evening 3D Light & Sound Show`],mapsUrl:`https://maps.app.goo.gl/95yG1Qy1eUqUjZ6A9`},{id:`marudhamalai`,title:`Marudhamalai Murugan Temple`,tagline:`Scenic Hilltop Sanctuary in the Western Ghats`,category:`Hilltop Temple`,image:`/assets/coimbatore/marudhamalai.jpg`,distance:`14 km · 25 mins from Venue`,location:`Marudhamalai, Coimbatore`,bestTime:`Early Morning (06:30 AM - 10:00 AM)`,description:`Perched gracefully atop a granite crest of the Western Ghats, this 12th-century shrine dedicated to Lord Murugan is celebrated for its lush herbal hills and panoramic views over Coimbatore city. A tranquil sanctuary where cool mountain air meets sacred serenity.`,highlights:[`Pambatti Siddhar Cave`,`Panoramic 360° Valley Views`,`Scenic Ghat Road`],mapsUrl:`https://maps.app.goo.gl/VqD2h6P4y6nJc7jU7`},{id:`valparai`,title:`Valparai & Anamalai Tea Hills`,tagline:`Rolling Emerald Tea Gardens & Misty Clouds`,category:`Hill Station & Nature`,image:`/assets/coimbatore/valparai.jpg`,distance:`65 km from Venue (via Pollachi)`,location:`Anamalai Hills, Western Ghats`,bestTime:`Day Trip / Early Morning Drive`,description:`Nestled 3,500 feet high in the Anamalai range, Valparai is a peaceful, untouched hill paradise. The scenic drive features 40 hairpin bends, cascading waterfalls, velvet-green tea estates, and opportunities to spot the endangered Nilgiri Tahr.`,highlights:[`40 Hairpin Mountain Drive`,`Lush Tea Plantation Walks`,`Sholayar Reservoir`],mapsUrl:`https://maps.app.goo.gl/3j2c7K1x7mQ8v9ZA8`},{id:`siruvani`,title:`Siruvani Waterfalls & Rainforest`,tagline:`World's Sweetest Natural Water`,category:`Nature & Cascades`,image:`/assets/coimbatore/siruvani.jpg`,distance:`35 km · 55 mins from Venue`,location:`Siruvani Hills, Western Ghats`,bestTime:`10:00 AM - 03:00 PM`,description:`Hidden deep inside the dense rainforest reserves of the Western Ghats, the Siruvani river is world-renowned for its exceptionally mineral-rich, sweet drinking water. The multi-tiered cascades tumbling into crystal pools are an unforgettable sight.`,highlights:[`World's Sweetest Water`,`Forest Safari Drive`,`Pristine Rainforest Scenery`],mapsUrl:`https://maps.app.goo.gl/dM1p9Z7t8B4e6kXQ8`},{id:`aliyar`,title:`Aliyar Dam & Foothills Reservoir`,tagline:`Tranquil Waters at the Base of the Mountains`,category:`Scenic Lake & Gardens`,image:`/assets/coimbatore/aliyar.jpg`,distance:`42 km · 50 mins from Venue`,location:`Foothills of Valparai, Pollachi`,bestTime:`Afternoon to Sunset (04:00 PM - 06:30 PM)`,description:`Sitting peacefully at the base of the towering Anamalai hills, Aliyar Dam is famous for its vast, mirror-like lake reflecting cloud-kissed peaks, well-maintained botanical gardens, and gentle boating.`,highlights:[`Mountain Reservoir Lake`,`Manicured Gardens & Play Area`,`Breathtaking Sunset Vistas`],mapsUrl:`https://maps.app.goo.gl/XqL3Z5xT7v2b1a8j6`}],families:{bride:{title:`Snegha's Family`,subtitle:`Welcoming you with warmth and love`,photo:`/assets/family/bride-family.jpg`,members:[{name:`Smt. M.Yogalakshmi & Sri. V.Muralidharan`}]},groom:{title:`Ashwin's Family`,subtitle:`Two families becoming one shared journey`,photo:`/assets/family/groom-family.jpg`,members:[{name:`Smt. S.Kalpana & Sri. D.Sampathkumar`}]}}};`scrollRestoration`in history&&(history.scrollRestoration=`manual`);var be=document.getElementById(`film-canvas`),xe=document.getElementById(`film`),I=document.getElementById(`details`),Se=document.getElementById(`loader-fill`),Ce=window.matchMedia(`(prefers-reduced-motion: reduce)`).matches,{bride:L,groom:R,wedding:z}=F,B=new Date(+z.calendarDetails.startDate.slice(0,4),z.calendarDetails.startDate.slice(4,6)-1,+z.calendarDetails.startDate.slice(6,8));document.querySelectorAll(`[data-names]`).forEach(e=>{e.innerHTML=e.dataset.order===`groom-first`?`${R.name} <em>${e.dataset.names}</em> ${L.name}`:`${L.name} <em>${e.dataset.names}</em> ${R.name}`}),document.querySelectorAll(`[data-date]`).forEach(e=>{e.textContent=`${String(B.getDate()).padStart(2,`0`)} · ${String(B.getMonth()+1).padStart(2,`0`)} · ${B.getFullYear()}`}),document.querySelectorAll(`[data-date-long]`).forEach(e=>{e.textContent=`${z.date} · ${z.city.split(`,`)[0]}`}),document.querySelectorAll(`[data-finale-date]`).forEach(e=>{e.textContent=z.date}),document.querySelectorAll(`[data-finale-line]`).forEach(e=>{e.textContent=F.finaleLine||``}),document.getElementById(`cover-logo`).setAttribute(`aria-label`,`${R.name} & ${L.name}`);var V=new Image;V.onload=V.onerror=()=>document.body.classList.add(`logo-in`),V.src=`/assets/logo/ashwin-snegha.webp`,me(I,F);var H=new he(F.music),U=document.getElementById(`music-toggle`);H.available||(U.hidden=!0,document.querySelector(`.cover-hint`).hidden=!0);function we(e){U.setAttribute(`aria-pressed`,String(e)),U.setAttribute(`aria-label`,e?`Pause music`:`Play music`)}function Te(e){try{return e&&localStorage.setItem(`invite-music`,e),localStorage.getItem(`invite-music`)}catch{return null}}xe.style.height=`${d*62+100}vh`,window.scrollTo(0,0);var W=new n(be,{preserveDrawingBuffer:!1}),G=f(i.length-1)+.85,Ee=[{el:document.getElementById(`ov-title`),out:[.08,.42],shade:[`top`,.66]},{el:document.getElementById(`ov-cue`),out:[.02,.22]},{el:document.getElementById(`to-top`),in:[.5,.85]},{el:document.getElementById(`ov-wed`),in:[G+.05,G+.4],out:[d-.45,d-.05],shade:[`top`,.55]},{el:document.getElementById(`ov-cue-finale`),in:[G+.33,G+.4],out:[d-.5,d-.1]}],De=e=>u.find(t=>t.kind===`link`&&t.i===e);(F.journey||[]).forEach(e=>{let t=i.findIndex(t=>t.src===e.frame);if(t<0)return;let n=document.createElement(`div`);n.className=`ov ov-note`;let r=document.createElement(`p`);r.className=`note-label`,r.textContent=e.label||``;let a=document.createElement(`p`);a.className=`note-text`,a.textContent=e.text||``,n.append(r,a),document.getElementById(`film-text`).appendChild(n);let o=t>0?De(t-1):null,s=De(t),c=f(t)+p(t);Ee.push({el:n,in:o?[o.start+.68*o.len,o.start+o.len+.08]:[-1,0],out:s?[c-.05,s.start+.22*s.len]:[G-.25,G],shade:[`bottom`,.76]})});var Oe=getComputedStyle(document.documentElement).getPropertyValue(`--bg`).trim()||`#3e0d16`,ke=new ye({bg:[1,3,5].map(e=>parseInt(Oe.slice(e,e+2),16)),details:I}),K=new ae({engine:W,film:xe,overlays:Ee,progressEl:document.getElementById(`progress-fill`),reducedMotion:Ce,onRender:e=>{let t=e.u>=G+.3&&e.u<d-.1;document.body.classList.toggle(`has-finale`,t),t&&!Y?Z||ze(6500):!Y&&e.u<G+.15&&Q(),ke.setFilm(e,W.W,W.H,Ee.filter(e=>e.shade&&e.last>0).map(e=>({edge:e.shade[0],amount:e.shade[1]*e.last})))}}),{ready:Ae}=le(i,{firstCount:2,onFrame:(e,t)=>{W.addFrame(e,t),ke.addFrame(e,t),K.invalidate()},onProgress:e=>{Se.style.transform=`scaleX(${e})`}});Ae.then(()=>{K.snap(),document.body.classList.add(`can-open`),H.preload(),setTimeout(()=>document.getElementById(`cover-open`).focus({preventScroll:!0}),250)});function je(){let e=document.body;e.classList.contains(`can-open`)&&!e.classList.contains(`is-ready`)&&(document.documentElement.classList.remove(`locked`),window.scrollTo(0,0),e.classList.add(`is-ready`),Te()!==`off`&&H.start().then(we),setTimeout(()=>ke.apply(),800),Ve())}document.getElementById(`loader`).addEventListener(`click`,je);var Me=7e3,Ne=f(1),Pe=f(2),q=[{t:0,u:0},{t:2.2,u:Ne+.15},{t:6,u:Ne+.45},{t:9.2,u:Pe+.15},{t:13,u:Pe+.45},{t:16.2,u:G+.4}];function Fe(e,t,n){let r=Math.max(0,Math.min(1,(n-e)/(t-e)));return r*r*(3-2*r)}function Ie(e){let t=q[q.length-1];if(e<=0)return 0;if(e>=t.t)return t.u;for(let t=0;t<q.length-1;t++){let n=q[t],r=q[t+1];if(e>=n.t&&e<=r.t){let t=Fe(n.t,r.t,e);return n.u+(r.u-n.u)*t}}return t.u}var Le=null,J=null,Y=!1,X=!1;function Re(){Le&&=(clearTimeout(Le),null),J&&=(cancelAnimationFrame(J),null),Y=!1}var Z=null;function ze(e=5e3){Q(),Z=setTimeout(()=>{I.getBoundingClientRect().top>window.innerHeight*.4&&I.scrollIntoView({behavior:`smooth`})},e)}function Q(){Z&&=(clearTimeout(Z),null)}function $(e){document.body.classList.contains(`is-ready`)&&(e&&e.target&&e.target.closest&&e.target.closest(`#music-toggle`)||(X=!0,Re(),Q()))}[`wheel`,`touchstart`,`touchmove`,`pointerdown`,`keydown`].forEach(e=>{window.addEventListener(e,$,{passive:!0,capture:!0})}),window.addEventListener(`scroll`,()=>{!Y&&window.scrollY>15&&$()},{passive:!0});function Be(){if(X||Y||window.scrollY>20)return;Y=!0;let e=performance.now(),t=q[q.length-1].t;function n(r){if(!Y||X)return;let i=(r-e)/1e3,a=Ie(i);K.measure();let o=K.filmTop+a/d*K.filmScroll;window.scrollTo(0,o),i>=t?(Re(),X=!0,ze(4500)):J=requestAnimationFrame(n)}J=requestAnimationFrame(n)}function Ve(){X||(Re(),Le=setTimeout(Be,Me))}document.getElementById(`skip`).addEventListener(`click`,e=>{e.preventDefault(),$(),I.scrollIntoView({behavior:`smooth`})}),U.addEventListener(`click`,()=>{H.toggle().then(e=>{we(e),Te(e?`on`:`off`)})}),document.getElementById(`to-top`).addEventListener(`click`,e=>{e.preventDefault(),$(),window.scrollTo({top:0,behavior:`smooth`})}),document.getElementById(`ov-cue-finale`)?.addEventListener(`click`,()=>{$(),I.scrollIntoView({behavior:`smooth`})}),new IntersectionObserver(([e])=>{document.body.classList.toggle(`in-details`,e.isIntersecting),e.isIntersecting&&Q()},{rootMargin:`0px 0px -55% 0px`}).observe(I);