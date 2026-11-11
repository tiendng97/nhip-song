// Nhịp Sống – mô phỏng 3D bộ đồ trên dáng người thật.
// Lưới người: MakeHuman base mesh + target "asian-male-young" (CC0, makehumancommunity), tay hạ xuống bằng xương mặc định.
// Co giãn theo số đo: chiều cao (đều), rồi vòng cổ/vai/ngực/eo/hông/đùi/bắp chân/bắp tay theo từng lát ngang.
const THREE_URL="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
let T=null,M=null,base=null,R=null,scene=null,cam=null,mesh=null,shapeKey="",shaped=null,normals0=null,cenS=null,adj=null,chE=null;
const G=["torso","pelvis","neck","head","shoulder","uarm","forearm","hand","thigh","calf","foot"],gi=n=>G.indexOf(n);
export async function ready(binUrl){
  if(base)return true;
  T=await import(THREE_URL);
  const buf=await (await fetch(binUrl)).arrayBuffer(),dv=new DataView(buf),hl=dv.getUint32(0,true);
  M=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,hl)));let o=4+hl;const n=M.n,nt=M.nt;
  const pos=new Int16Array(buf.slice(o,o+n*6));o+=n*6;const idx=new Uint16Array(buf.slice(o,o+nt*6));o+=nt*6;
  const lab=new Uint8Array(buf.slice(o,o+n));o+=n;const tp=new Int16Array(buf.slice(o,o+n*2));o+=n*2;const cen=new Int16Array(buf.slice(o,o+n*4));
  const nb=Array.from({length:n},()=>new Set());for(let i=0;i<idx.length;i+=3){const a=idx[i],b=idx[i+1],c=idx[i+2];nb[a].add(b).add(c);nb[b].add(a).add(c);nb[c].add(a).add(b)}adj=nb.map(z=>Int32Array.from(z));
  const P=new Float32Array(n*3);for(let i=0;i<n*3;i++)P[i]=pos[i]/M.sc;
  let y0=1e9,y1=-1e9;for(let i=0;i<n;i++){y0=Math.min(y0,P[i*3+1]);y1=Math.max(y1,P[i*3+1])}
  base={n,P,idx,lab,t:Float32Array.from(tp,v=>v/200),cen:Float32Array.from(cen,v=>v/M.sc),y0,Hb:y1-y0};
  R=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});R.setPixelRatio(1);R.setSize(360,720);
  R.outputColorSpace=T.SRGBColorSpace;R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1.05;
  scene=new T.Scene();scene.add(new T.HemisphereLight(0xffffff,0x6b6258,1.25));
  const k=new T.DirectionalLight(0xffffff,1.9);k.position.set(4,7,9);scene.add(k);const f=new T.DirectionalLight(0xffffff,.6);f.position.set(-6,3,4);scene.add(f);const b=new T.DirectionalLight(0xffffff,.7);b.position.set(0,4,-8);scene.add(b);
  const g=new T.BufferGeometry();g.setIndex(new T.BufferAttribute(base.idx,1));g.setAttribute("position",new T.BufferAttribute(new Float32Array(n*3),3));g.setAttribute("color",new T.BufferAttribute(new Float32Array(n*3),3));
  mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:0}));mesh.rotation.y=-0.32;scene.add(mesh);
  cam=new T.PerspectiveCamera(20,0.5,1,400);return true}
// tỉ lệ người/mẫu theo từng mốc (mốc: [vị trí dọc 0..1, vòng cm])
function shape(B){const key=JSON.stringify(B);if(key===shapeKey)return;shapeKey=key;const L=M.lm,s=(B.h||170)/M.H,r=(k,v)=>v&&L[k]?Math.max(.7,Math.min(1.5,v/(L[k][1]*s))):1;
  const rt={neck:r("neck",B.ne),sh:r("sh",B.sh),chest:r("chest",B.ch),waist:r("waist",B.wa),hip:r("hip",B.hi),thigh:r("thigh",B.th),calf:r("calf",B.ca),arm:r("arm",B.ar)};
  const torsoK=[[M.crotch,rt.hip],[L.hip[0],rt.hip],[L.waist[0],rt.waist],[L.chest[0],rt.chest],[L.sh[0],rt.sh],[L.neck[0],rt.neck],[0.875,1],[1.1,1]];
  const legK=[[0,1],[0.05,rt.calf*0.97],[L.calf[0],rt.calf],[0.3,(rt.calf+rt.thigh)/2],[L.thigh[0],rt.thigh],[M.crotch,rt.hip]];
  const itp=(K,y)=>{if(y<=K[0][0])return K[0][1];for(let i=1;i<K.length;i++)if(y<=K[i][0]){const a=K[i-1],b=K[i],t=(y-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t}return K[K.length-1][1]};
  const {n,P,lab,cen,y0,Hb}=base,O=new Float32Array(n*3);cenS=new Float32Array(n*2);const armL=[gi("uarm"),gi("forearm"),gi("hand")],legL=[gi("thigh"),gi("calf"),gi("foot")];
  for(let i=0;i<n;i++){const x=P[i*3],y=P[i*3+1],z=P[i*3+2],yf=(y-y0)/Hb,l=lab[i],cx=cen[i*2],cz=cen[i*2+1];let f,dx=0;
    const isArm=armL.includes(l),isLeg=legL.includes(l)&&!(cx===0);
    if(isArm){f=l===gi("hand")?1:rt.arm;dx=(rt.sh-1)*cx*0.9}else if(isLeg)f=l===gi("foot")?1:itp(legK,yf);else f=l===gi("head")?1:itp(torsoK,yf);
    if(isLeg){const hx=(rt.hip-1)*cx*0.85;dx=hx*Math.min(1,Math.max(0,(yf-0.05)/(M.crotch-0.05)))}
    cenS[i*2]=(cx+dx)*s;cenS[i*2+1]=cz*s;O[i*3]=(cx+(x-cx)*f+dx)*s;O[i*3+1]=(y-y0)*s;O[i*3+2]=(cz+(z-cz)*f)*s}
  {const NB=48,pr=new Float32Array(NB),py=new Float32Array(NB);let W=0;for(let i=0;i<n;i++){if(lab[i]!==gi("torso"))continue;const yf=(P[i*3+1]-y0)/Hb;if(yf<L.chest[0]-0.07||yf>L.chest[0]+0.012)continue;const x=O[i*3],dz=O[i*3+2]-cenS[i*2+1],a=Math.atan2(dz,x),b=((Math.round(a/(2*Math.PI)*NB)%NB)+NB)%NB;{const rr=Math.hypot(x,dz);if(rr>pr[b]){pr[b]=rr;py[b]=yf}}W=Math.max(W,Math.abs(x))}
    for(let k=0;k<NB;k++)if(!pr[k]){let a=1;while(!pr[(k+a)%NB]&&a<NB)a++;pr[k]=pr[(k+a)%NB]}const sm=pr.map((v,k)=>(pr[(k+NB-1)%NB]+2*v+pr[(k+1)%NB])/4);chE={pr:sm,py,NB,W,y:L.chest[0]}}
  shaped=O;const g=mesh.geometry;g.attributes.position.array.set(O);g.attributes.position.needsUpdate=true;g.computeVertexNormals();normals0=g.attributes.normal.array.slice()}
// o: {top,bot,out,shoe,acc[]} – mỗi món {col:[hex,hex2],pat,fit,sub,cat,form}
export async function render(o,B){shape(B);const {n,lab,t,y0,Hb,cen}=base,s=(B.h||170)/M.H,g=mesh.geometry,C=g.attributes.color.array,Pp=g.attributes.position.array;Pp.set(shaped);
  const col=h=>{const c=new T.Color(h||"#999");return [c.r,c.g,c.b]},SK=col("#d3a988"),HA=col("#1e1915");
  const top=o.top,bot=o.bot,out=o.out,sh=o.shoe,acc=o.acc||[];const sub=w=>w&&w.sub||"";
  const cm=v=>v/10*s; // 1 cm theo đơn vị mô hình (dm)
  const fitE=w=>w?[0,.35,.8,1.6][w.fit||2]:0;
  const shortS=/Short/.test(sub(bot)),tuck=top&&/Sơ mi|Polo/.test(sub(top))&&bot&&(bot.form||3)>=3,pantsTop=bot&&(bot.form||3)>=4?0.628:0.612;
  const tank=top&&/ba lỗ/.test(sub(top)),longSl=top&&/Sơ mi|Áo len|Hoodie/.test(sub(top)),slT=longSl?0.98:tank?-1:[0,.30,.36,.42][top&&top.fit||2],hem=top?(tuck?pantsTop:0.522):0,belt=acc.find(w=>w.sub==="Thắt lưng"),watch=acc.find(w=>w.sub==="Đồng hồ"),cap=acc.find(w=>w.sub==="Mũ");
  const jHem=out?(out.sub==="Blazer"?0.462:0.49):0,isArm=l=>l===gi("uarm")||l===gi("forearm")||l===gi("hand"),isLeg=l=>l===gi("thigh")||l===gi("calf")||l===gi("foot");
  const stripe=(w,yf,c)=>w&&w.pat===1&&w.col2?(Math.floor(yf*B.h/1.6)%2?col(w.col2):c):c;
  const SW=new Float32Array(n),FL=new Uint8Array(n);
  const ss=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)},mix=(c,d,a)=>a<=0?c:a>=1?d:[c[0]+(d[0]-c[0])*a,c[1]+(d[1]-c[1])*a,c[2]+(d[2]-c[2])*a];
  for(let i=0;i<n;i++){const l=lab[i],yf=Pp[i*3+1]/(Hb*s),tt=t[i],cz=cen[i*2+1]*s,z=Pp[i*3+2],x=Pp[i*3];let c=SK,e=0,sm=0,leg=0,boxT=0,boxA=0;
    const torsoish=!isArm(l)&&!(isLeg(l)&&cen[i*2]!==0)&&l!==gi("head")&&l!==gi("hand"),legV=isLeg(l)&&cen[i*2]!==0&&l!==gi("foot"),armV=isArm(l)&&l!==gi("hand");
    const lay=(col,a,ee,smw)=>{if(a<=0)return;c=mix(c,col,a);e=Math.max(e*(1-a),ee*a+e*(1-a));if(a>0.5)sm=smw};
    if(l===gi("head")){const dz=(z-cz)/s,hz=Math.max(ss(0.95,0.962,yf),ss(0.905,0.918,yf)*ss(0.02,-0.12,dz),ss(0.93,0.942,yf)*ss(0.55,0.62,Math.abs(x/s))*ss(0.4,0.3,dz));lay(HA,hz,cm(.25),0);if(cap)lay(col(cap.col[0]),ss(0.94,0.952,yf),cm(.6),0)}
    if(bot){const yl=shortS?0.312:0.042,aL=legV?ss(yl-0.006,yl+0.006,yf):0,aT=torsoish?1-ss(pantsTop-0.003,pantsTop+0.003,yf):0,ap=Math.max(aL,aT);if(ap>0){lay(stripe(bot,yf,col(bot.col[0])),ap,cm(fitE(bot)),shortS&&legV&&yf<yl+0.03?0.15:.8);if(legV&&ap>0.5)leg=1}}
    if(top){const col2=/Sơ mi|Polo/.test(sub(top))&&l===gi("neck")?1-ss(0.848,0.856,yf):0;let at=0;
      if(torsoish&&l!==gi("neck"))at=tuck?ss(pantsTop-0.003,pantsTop+0.003,yf):ss(hem-0.006,hem+0.006,yf);
      if(tank&&torsoish&&yf>0.69){const ax=Math.abs(x)/(chE.W||1);at*=1-ss(0.86,0.95,ax)*ss(0.69,0.72,yf)}if(armV)at=tank?0:1-ss(slT-0.025,slT+0.025,tt);if(l===gi("shoulder"))at=tank?0:1;if(at>0.5){if(torsoish&&l!==gi("neck"))boxT=1;if(armV)boxA=1}at=Math.max(at,col2);lay(stripe(top,yf,col(top.col[0])),at,cm(fitE(top)+(armV?0.2:0)),torsoish?1:.6)}
    if(belt&&tuck&&torsoish)lay(col(belt.col[0]),ss(pantsTop-0.019,pantsTop-0.013,yf)*(1-ss(pantsTop-0.001,pantsTop+0.004,yf)),cm(fitE(bot)+0.35),0);
    if(out){let aj=0;if(torsoish&&l!==gi("neck"))aj=ss(jHem-0.006,jHem+0.006,yf);if(l===gi("neck"))aj=1-ss(0.845,0.853,yf);if(armV||l===gi("shoulder"))aj=1;
      if(torsoish&&(z-cz)>0){const w=cm(out.sub==="Blazer"?(yf>0.72?4+(yf-0.72)*80:4):5.5),op=(1-ss(w-cm(1.2),w+cm(1.2),Math.abs(x)))*ss(0.0,cm(2),z-cz);aj*=1-op}
      lay(col(out.col[0]),aj,cm(fitE(out)+1.4+(armV?0.3:0)),1)}
    if(sh)lay(col(sh.col[0]),Math.max(l===gi("foot")?1:0,1-ss(0.03,0.045,yf)),cm(/Sandal/.test(sub(sh))?0.3:1.7),2);
    if(watch&&armV&&x>0)lay(col(watch.col[0]),ss(0.895,0.905,tt)*(1-ss(0.955,0.965,tt)),cm(.45),0);
    C[i*3]=c[0];C[i*3+1]=c[1];C[i*3+2]=c[2];if(e){Pp[i*3]+=normals0[i*3]*e;Pp[i*3+1]+=normals0[i*3+1]*e;Pp[i*3+2]+=normals0[i*3+2]*e}SW[i]=sm;
    FL[i]=(boxT?1:0)|(boxA?2:0)|(leg?4:0);
    // quần ống đứng: không ôm sát bắp chân/cổ chân
}
  // làm mượt vải (Taubin) để không lộ cơ bắp dưới áo
  for(let it=0;it<14;it++)for(const lam of [0.55,-0.57]){const Q=Pp.slice();for(let i=0;i<n;i++){const w=Math.min(1,SW[i]);if(!w||(SW[i]<2&&it>=10))continue;const A=adj[i];let ax=0,ay=0,az=0;for(let k=0;k<A.length;k++){const j=A[k];ax+=Q[j*3];ay+=Q[j*3+1];az+=Q[j*3+2]}const m=A.length;Pp[i*3]+=w*lam*(ax/m-Q[i*3]);Pp[i*3+1]+=w*lam*(ay/m-Q[i*3+1]);Pp[i*3+2]+=w*lam*(az/m-Q[i*3+2])}}
  for(let it=0;it<12;it++)for(const lam of [0.5]){const Q=Pp.slice();for(let i=0;i<n;i++){if(SW[i]<2)continue;const A=adj[i];let ax=0,ay=0,az=0;for(let k=0;k<A.length;k++){const j=A[k];ax+=Q[j*3];ay+=Q[j*3+1];az+=Q[j*3+2]}const m=A.length;Pp[i*3]+=lam*(ax/m-Q[i*3]);Pp[i*3+1]+=lam*(ay/m-Q[i*3+1]);Pp[i*3+2]+=lam*(az/m-Q[i*3+2])}}

  // ràng buộc dáng vải sau khi làm mượt
  const push=(i,cx,cz2,rmin)=>{const dx=Pp[i*3]-cx,dz=Pp[i*3+2]-cz2,rr=Math.hypot(dx,dz);if(rr>1e-6&&rr<rmin){Pp[i*3]=cx+dx/rr*rmin;Pp[i*3+2]=cz2+dz/rr*rmin}};
  const drapeIdx=[];
  for(let i=0;i<n;i++){const f=FL[i];if(!f)continue;const yf=Pp[i*3+1]/(Hb*s);
    if(f&1)drapeIdx.push(i);
    if(f&2&&!longSl)push(i,cenS[i*2],cenS[i*2+1],(B.ar||30)/(2*Math.PI)/10*[1,1.04,1.14,1.26][top.fit||2]);
    if(f&4&&shortS&&yf>=0.3)push(i,cenS[i*2],cenS[i*2+1],(B.th||52)/(2*Math.PI)/10*[1,0.98,1.02,1.07][bot.fit||2]);
    if(f&4&&!shortS&&yf<0.34)push(i,cenS[i*2],cenS[i*2+1],s*(/Jeans/.test(sub(bot))?0.55:/Jogger|thể thao/.test(sub(bot))?0.47+0.08*Math.min(1,yf/0.15):0.6)*(1+fitE(bot)*0.08))}

  // áo: "bọc co" – lấp chỗ lõm (rãnh cơ ngực/bụng) nhưng giữ chỗ lồi → mặt vải trơn, không gờ
  if(drapeIdx.length){const set=new Uint8Array(n);drapeIdx.forEach(i=>set[i]=1);const Q=Pp.slice();
    for(let it=0;it<28;it++){const R2=Q.slice();for(const i of drapeIdx){const A=adj[i];let ax=0,ay=0,az=0;for(let k=0;k<A.length;k++){const j=A[k];ax+=R2[j*3];ay+=R2[j*3+1];az+=R2[j*3+2]}const m=A.length;Q[i*3]+=0.5*(ax/m-R2[i*3]);Q[i*3+1]+=0.5*(ay/m-R2[i*3+1]);Q[i*3+2]+=0.5*(az/m-R2[i*3+2])}}
    for(const i of drapeIdx){const cz2=cenS[i*2+1],ro=Math.hypot(Pp[i*3],Pp[i*3+2]-cz2),rq=Math.hypot(Q[i*3],Q[i*3+2]-cz2);if(rq>ro){const t=Math.min(1,(rq-ro)/(ro*0.02+1e-6));Pp[i*3]+= (Q[i*3]-Pp[i*3])*t;Pp[i*3+2]+=(Q[i*3+2]-Pp[i*3+2])*t;Pp[i*3+1]+=(Q[i*3+1]-Pp[i*3+1])*t*0.5}}}
  g.attributes.color.needsUpdate=true;g.attributes.position.needsUpdate=true;g.computeVertexNormals();
  const H=Hb*s;cam.position.set(0,H*0.53,H*3.05);cam.lookAt(0,H*0.5,0);R.render(scene,cam);return R.domElement.toDataURL("image/webp",0.9)}
