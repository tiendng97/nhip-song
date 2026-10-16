/* Nhịp Sống – lớp kết nối Supabase.
   Cung cấp window.claude.use(...) giống bản chạy trên claude.ai để phần app giữ nguyên:
   db (đồng bộ), user, assets (ảnh/PDF), sample (AI đọc ảnh qua Claude API), downloads, mcp (giữ chỗ). */
(function(){
  "use strict";
  const CFG=window.NS_CONFIG||{};
  const TABLE="user_data",BUCKET="files",FN="doc-read";
  const $=s=>gate.querySelector(s);
  const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
  const lsSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}};
  const lsDel=k=>{try{localStorage.removeItem(k)}catch(e){}};

  /* ---------- Màn hình đăng nhập / cấu hình ---------- */
  const css=`
  #ns-gate{position:fixed;inset:0;z-index:9999;background:var(--bg,#F2F5F3);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto}
  #ns-gate[hidden]{display:none!important}
  #ns-gate .g-card{width:100%;max-width:380px;background:var(--surface,#fff);border:1px solid var(--line,#D6E0DB);border-radius:16px;padding:28px 22px;box-shadow:var(--shadow,0 4px 14px rgba(0,0,0,.06))}
  #ns-gate .g-logo{width:56px;height:56px;border-radius:14px;display:block;margin:0 auto 10px}
  #ns-gate h1{font-family:var(--f-display,Georgia,serif);font-size:26px;font-weight:600;text-align:center;margin:0 0 2px;color:var(--ink,#16221E)}
  #ns-gate .g-sub{text-align:center;color:var(--ink-3,#7A8A84);font-size:13px;margin:0 0 20px}
  #ns-gate label{display:block;font-size:13px;font-weight:600;color:var(--ink-2,#4D5E58);margin:12px 0 5px}
  #ns-gate input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:11px 12px;border-radius:10px;border:1px solid var(--line,#D6E0DB);background:var(--surface,#fff);color:var(--ink,#16221E)}
  #ns-gate input:focus{outline:2px solid var(--jade,#1D6A56);outline-offset:1px}
  #ns-gate .g-btn{width:100%;margin-top:18px;font:inherit;font-weight:600;font-size:15px;padding:12px;border-radius:10px;border:0;background:var(--jade,#1D6A56);color:var(--on-jade,#fff);cursor:pointer}
  #ns-gate .g-btn[disabled]{opacity:.6;cursor:wait}
  #ns-gate .g-link{display:block;margin:14px auto 0;background:none;border:0;color:var(--jade,#1D6A56);font:inherit;font-size:14px;cursor:pointer;text-decoration:underline}
  #ns-gate .g-msg{min-height:20px;margin:12px 0 0;font-size:13px;text-align:center;color:var(--red,#B2433A)}
  #ns-gate .g-msg.ok{color:var(--ok,#2C7A4C)}
  #ns-gate .g-note{font-size:12px;color:var(--ink-3,#7A8A84);margin:14px 0 0;line-height:1.5}
  #ns-net{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:9000;background:var(--amber-soft,#F5E6CA);color:var(--amber,#A86F14);border:1px solid currentColor;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600}
  #ns-net[hidden]{display:none}
  img[data-blob]:not([src]){background:var(--surface-2,#E8EEEB)}`;
  const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
  const gate=document.createElement("div");gate.id="ns-gate";gate.hidden=true;
  const net=document.createElement("div");net.id="ns-net";net.hidden=true;net.textContent="Đang ngoại tuyến – dữ liệu sẽ tự đồng bộ khi có mạng";
  function mount(){document.body.appendChild(gate);document.body.appendChild(net)}
  if(document.body)mount();else document.addEventListener("DOMContentLoaded",mount);
  const showNet=()=>{net.hidden=navigator.onLine};
  addEventListener("online",showNet);addEventListener("offline",showNet);setTimeout(showNet,0);

  function gateConfig(){
    gate.hidden=false;
    gate.innerHTML='<div class="g-card"><img class="g-logo" src="icon-192.png" alt=""><h1>Nhịp Sống</h1><p class="g-sub">Thiếu cấu hình máy chủ</p>'
      +'<p class="g-note">Mở file <b>config.js</b>, điền <b>url</b> và <b>anonKey</b> của dự án Supabase (xem HUONG-DAN.md, bước 2), rồi tải lại trang.</p></div>';
  }
  let signupMode=false;
  function gateLogin(msg,ok){
    gate.hidden=false;
    gate.innerHTML='<form class="g-card" id="ns-login" novalidate><img class="g-logo" src="icon-192.png" alt=""><h1>Nhịp Sống</h1><p class="g-sub">'+(signupMode?"Tạo tài khoản (chỉ làm một lần)":"Đăng nhập để đồng bộ mọi thiết bị")+'</p>'
      +'<label for="ns-em">Email</label><input id="ns-em" type="email" autocomplete="email" inputmode="email" required>'
      +'<label for="ns-pw">Mật khẩu</label><input id="ns-pw" type="password" autocomplete="'+(signupMode?"new-password":"current-password")+'" minlength="6" required>'
      +'<button class="g-btn" type="submit">'+(signupMode?"Tạo tài khoản":"Đăng nhập")+'</button>'
      +'<p class="g-msg'+(ok?" ok":"")+'" role="status">'+esc(msg||"")+'</p>'
      +'<button type="button" class="g-link" id="ns-toggle">'+(signupMode?"Đã có tài khoản? Đăng nhập":"Lần đầu dùng? Tạo tài khoản")+'</button></form>';
    const f=$("#ns-login");
    $("#ns-toggle").onclick=()=>{signupMode=!signupMode;gateLogin()};
    f.onsubmit=async e=>{
      e.preventDefault();
      const email=$("#ns-em").value.trim(),password=$("#ns-pw").value;
      const m=f.querySelector(".g-msg"),b=f.querySelector(".g-btn");
      if(!email||password.length<6){m.className="g-msg";m.textContent="Nhập email và mật khẩu (ít nhất 6 ký tự)";return}
      b.disabled=true;m.className="g-msg";m.textContent="";
      try{
        if(signupMode){
          const {data,error}=await sb.auth.signUp({email,password});
          if(error)throw error;
          if(!data.session){signupMode=false;gateLogin("Đã tạo tài khoản. Mở email để xác nhận rồi đăng nhập.",true);return}
        }else{
          const {error}=await sb.auth.signInWithPassword({email,password});
          if(error)throw error;
        }
      }catch(err){
        const s=String(err&&err.message||"");
        m.textContent=/invalid login/i.test(s)?"Sai email hoặc mật khẩu":/not confirmed/i.test(s)?"Email chưa được xác nhận – mở hộp thư để xác nhận":/signups? not allowed|disabled/i.test(s)?"Đã khoá đăng ký tài khoản mới":/already registered/i.test(s)?"Email này đã có tài khoản – bấm Đăng nhập":/fetch|network/i.test(s)?"Không kết nối được máy chủ. Kiểm tra mạng.":/rate limit/i.test(s)?"Thử quá nhiều lần, đợi vài phút":"Lỗi: "+s.slice(0,120);
        b.disabled=false;
      }
    };
    setTimeout(()=>{const i=$("#ns-em");if(i)i.focus()},30);
  }
  const hideGate=()=>{gate.hidden=true;gate.innerHTML=""};

  if(!CFG.url||!CFG.anonKey||/YOUR_|DIEN_/.test(CFG.url+CFG.anonKey)||!window.supabase){
    gateConfig();
    window.claude={use:()=>new Promise(()=>{})};
    return;
  }
  const sb=window.supabase.createClient(CFG.url,CFG.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:"ns-auth"}});

  /* ---------- Phiên đăng nhập ---------- */
  let user=null,resolveAuth;
  const authed=new Promise(r=>resolveAuth=r);
  function signedIn(u){if(user)return;user={id:u.id,email:u.email||""};lsSet("ns-last-user",JSON.stringify(user));hideGate();resolveAuth(user)}
  (async()=>{
    let s=null;
    try{const r=await sb.auth.getSession();s=r.data&&r.data.session}catch(e){}
    if(s&&s.user){signedIn(s.user);return}
    // Ngoại tuyến nhưng đã từng đăng nhập trên máy này: vẫn mở bằng dữ liệu đã lưu
    const last=lsGet("ns-last-user");
    if(!navigator.onLine&&last&&lsGet("ns-auth")){try{signedIn(JSON.parse(last));return}catch(e){}}
    gateLogin();
  })();
  sb.auth.onAuthStateChange((ev,s)=>{
    if(s&&s.user&&!user)signedIn(s.user);
    if(ev==="SIGNED_OUT"&&user){location.reload()}
  });
  window.NS={
    get email(){return user&&user.email||""},
    async signOut(){
      try{await sb.auth.signOut()}catch(e){}
      Object.keys(localStorage).filter(k=>k.startsWith("ns-cache:")).forEach(lsDel);
      lsDel("ns-last-user");location.reload();
    }
  };

  /* ---------- Lỗi mạng ---------- */
  function mapErr(error,status){
    const s=String(error&&(error.message||error.error_description||error)||"");
    const st=status||error&&error.status;
    const e=new Error(s);
    if(!navigator.onLine||/fetch|network|timeout|load failed|aborted/i.test(s)||st===0||st>=500)e.code="unavailable";
    else if(st===401||/jwt|token/i.test(s)){e.code="unavailable";sb.auth.refreshSession().catch(()=>{})}
    else if(st===413||/too large|payload/i.test(s))e.code="quota_exceeded";
    else if(st===403||/permission|policy|row-level/i.test(s))e.code="permission_denied";
    else e.code="error";
    return e;
  }

  /* ---------- db: mỗi mô-đun một dòng {user_id, module, data} ---------- */
  const mem={},subs={},lastJSON={};
  const cKey=mod=>"ns-cache:"+user.id+":"+mod;
  const readCache=mod=>{try{const r=lsGet(cKey(mod));return r?JSON.parse(r):null}catch(e){return null}};
  const writeCache=(mod,data,pending)=>{lsSet(cKey(mod),JSON.stringify({data,ts:Date.now(),pending:!!pending}))};
  const snap=data=>({exists:data!=null,data:()=>data==null?undefined:JSON.parse(JSON.stringify(data)),metadata:{hasPendingWrites:false}});
  function emit(mod){(subs[mod]||[]).forEach(cb=>{try{cb(snap(mem[mod]))}catch(e){console.error(e)}})}
  function take(mod,data){const j=JSON.stringify(data);if(j===lastJSON[mod])return false;lastJSON[mod]=j;mem[mod]=data;return true}

  async function fetchAll(){
    const {data,error,status}=await sb.from(TABLE).select("module,data,updated_at");
    if(error)throw mapErr(error,status);
    return data||[];
  }
  let dbReady=null;
  function initialLoad(){
    if(dbReady)return dbReady;
    dbReady=(async()=>{
      await authed;
      const loadedKey="ns-loaded:"+user.id;
      for(let attempt=0;;attempt++){
        try{
          const rows=await fetchAll();
          const byMod={};rows.forEach(r=>byMod[r.module]=r);
          // Nạp các thay đổi còn treo từ lần ngoại tuyến trước
          Object.keys(localStorage).filter(k=>k.startsWith("ns-cache:"+user.id+":")).forEach(k=>{
            const mod=k.slice(("ns-cache:"+user.id+":").length);const c=readCache(mod);
            if(c&&c.pending){const r=byMod[mod];if(!r||Date.parse(r.updated_at)<c.ts){byMod[mod]={module:mod,data:c.data,updated_at:new Date(c.ts).toISOString(),_push:true}}}
          });
          for(const mod in byMod){
            const r=byMod[mod];take(mod,r.data);writeCache(mod,r.data,!!r._push);
            if(r._push)upsert(mod,r.data).then(()=>writeCache(mod,r.data,false)).catch(()=>{});
          }
          lsSet(loadedKey,"1");
          if(attempt>0)hideGate();
          return;
        }catch(e){
          if(lsGet(loadedKey)){if(attempt>0)hideGate();
            Object.keys(localStorage).filter(k=>k.startsWith("ns-cache:"+user.id+":")).forEach(k=>{const mod=k.slice(("ns-cache:"+user.id+":").length);const c=readCache(mod);if(c)take(mod,c.data)});
            return;
          }
          gate.hidden=false;gate.innerHTML='<div class="g-card"><img class="g-logo" src="icon-192.png" alt=""><h1>Nhịp Sống</h1><p class="g-sub">'+(e.code==="unavailable"?"Cần có mạng cho lần mở đầu tiên trên máy này…":"Máy chủ báo lỗi, đang thử lại…")+'</p>'+(e.code==="unavailable"?"":'<p class="g-note">'+esc(e.message)+'<br>Kiểm tra lại bước chạy SQL trong HUONG-DAN.md.</p>')+'</div>';
          await new Promise(r=>setTimeout(r,3000));
        }
      }
    })();
    return dbReady;
  }
  async function upsert(mod,data){
    const {error,status}=await sb.from(TABLE).upsert({user_id:user.id,module:mod,data,updated_at:new Date().toISOString()},{onConflict:"user_id,module"});
    if(error)throw mapErr(error,status);
  }
  async function refresh(){
    if(!user||!navigator.onLine)return;
    try{const rows=await fetchAll();rows.forEach(r=>{const c=readCache(r.module);if(c&&c.pending)return;if(take(r.module,r.data)){writeCache(r.module,r.data,false);emit(r.module)}})}catch(e){}
  }
  let rtStarted=false;
  function startRealtime(){
    if(rtStarted)return;rtStarted=true;
    try{
      sb.channel("ud-"+user.id).on("postgres_changes",{event:"*",schema:"public",table:TABLE,filter:"user_id=eq."+user.id},p=>{
        const r=p.new;if(!r||!r.module)return;const c=readCache(r.module);if(c&&c.pending)return;
        if(take(r.module,r.data)){writeCache(r.module,r.data,false);emit(r.module)}
      }).subscribe();
    }catch(e){}
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refresh()});
    addEventListener("online",refresh);
  }
  const db={
    doc(path){
      const mod=String(path).split("/").pop();
      return {
        onSnapshot(cb){
          (subs[mod]=subs[mod]||[]).push(cb);
          setTimeout(()=>{try{cb(snap(mem[mod]))}catch(e){console.error(e)}},0);
          startRealtime();
          return ()=>{subs[mod]=(subs[mod]||[]).filter(f=>f!==cb)};
        },
        async set(v){
          const data=JSON.parse(JSON.stringify(v));
          writeCache(mod,data,true);mem[mod]=data;lastJSON[mod]=JSON.stringify(data);
          await upsert(mod,data);
          writeCache(mod,data,false);
        }
      };
    }
  };

  /* ---------- Ảnh / PDF ---------- */
  const EXT={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","application/pdf":"pdf"};
  const assets={
    async upload(blob,opt){
      const type=(opt&&opt.type)||blob.type||"application/octet-stream";
      if(!EXT[type]){const e=new Error("type");e.code="unsupported_type";throw e}
      if(blob.size>20*1024*1024){const e=new Error("size");e.code="too_large";throw e}
      const id=user.id+"/"+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2))+"."+EXT[type];
      const {error}=await sb.storage.from(BUCKET).upload(id,blob,{contentType:type,upsert:false,cacheControl:"31536000"});
      if(error){const e=new Error(error.message);e.code=/size|large/i.test(error.message)?"too_large":/quota|limit/i.test(error.message)?"quota_or_state":"error";throw e}
      return {id,contentType:type};
    },
    async delete(id){await sb.storage.from(BUCKET).remove([id])}
  };
  // Ảnh trong app dùng data-blob="<id>"; tạo link ký tên (1 giờ) rồi gắn vào src/href
  const urlCache={};let pendingIds=new Set(),hydTimer=null;
  function applyUrl(el,url){if(el.tagName==="IMG")el.src=url;else el.href=url;el.dataset.hyd="1"}
  function hydrate(root){
    (root||document).querySelectorAll("[data-blob]:not([data-hyd])").forEach(el=>{
      const id=el.dataset.blob,c=urlCache[id];
      if(c&&c.exp>Date.now())applyUrl(el,c.url);else pendingIds.add(id);
    });
    if(pendingIds.size&&!hydTimer)hydTimer=setTimeout(flushHyd,30);
  }
  async function flushHyd(){
    hydTimer=null;const ids=[...pendingIds];pendingIds=new Set();if(!ids.length||!user)return;
    try{
      const {data,error}=await sb.storage.from(BUCKET).createSignedUrls(ids,3600);
      if(error)throw error;
      (data||[]).forEach(d=>{if(d.signedUrl)urlCache[d.path]={url:d.signedUrl,exp:Date.now()+50*60e3}});
    }catch(e){}
    document.querySelectorAll("[data-blob]:not([data-hyd])").forEach(el=>{const c=urlCache[el.dataset.blob];if(c)applyUrl(el,c.url);else if(el.tagName==="IMG"){el.dataset.hyd="1";el.alt="Không tải được ảnh"}});
  }
  new MutationObserver(()=>{if(user)hydrate()}).observe(document.documentElement,{childList:true,subtree:true});
  authed.then(()=>hydrate());

  /* ---------- AI đọc ảnh/PDF qua Claude API (Edge Function "doc-read") ---------- */
  function readB64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(",")[1]);r.onerror=()=>rej(r.error);r.readAsDataURL(blob)})}
  async function prepImage(f){
    if(f.type==="application/pdf")return {type:f.type,data:await readB64(f)};
    try{
      const bm=await createImageBitmap(f);const k=Math.min(1,1600/Math.max(bm.width,bm.height));
      const c=document.createElement("canvas");c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);
      c.getContext("2d").drawImage(bm,0,0,c.width,c.height);
      const b=await new Promise(r=>c.toBlob(r,"image/jpeg",.88));
      if(b)return {type:"image/jpeg",data:await readB64(b)};
    }catch(e){}
    return {type:f.type,data:await readB64(f)};
  }
  const sample=async()=>{const e=new Error("unsupported");e.code="unsupported";throw e};
  sample.limits=async()=>(CFG.ai==="api"?{images:{maxCount:8}}:{images:null});
  sample.json=async(prompt,opt)=>{
    opt=opt||{};
    const files=await Promise.all((opt.images||[]).map(prepImage));
    const size=files.reduce((n,f)=>n+f.data.length,0);
    if(size>28e6){const e=new Error("big");e.code="image_rejected";throw e}
    let resp;
    try{
      const {data:{session}}=await sb.auth.getSession();
      resp=await fetch(CFG.url.replace(/\/$/,"")+"/functions/v1/"+FN,{method:"POST",headers:{"Content-Type":"application/json",apikey:CFG.anonKey,Authorization:"Bearer "+(session?session.access_token:CFG.anonKey)},body:JSON.stringify({prompt,files,schema:opt.schema||null})});
    }catch(err){const e=new Error("net");e.code="unavailable";throw e}
    let body=null;try{body=await resp.json()}catch(e){}
    if(!resp.ok||!body||body.error){
      const e=new Error(body&&body.message||"HTTP "+resp.status);
      e.code=body&&body.error||(resp.status===401?"not_signed_in":resp.status===403?"not_granted":resp.status===429?"rate_limited":resp.status===404?"no_function":"error");
      throw e;
    }
    return body.result;
  };

  /* ---------- Tải file sao lưu ---------- */
  const downloads={async save(o){
    const blob=new Blob([o.data],{type:o.mimeType||"application/json"});const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=o.filename||"nhip-song.json";document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  }};

  const apis={
    db:async()=>{await initialLoad();return db},
    user:async()=>{await authed;return {id:async()=>user.id,email:async()=>user.email}},
    assets:async()=>{await authed;return assets},
    sample:async()=>{await authed;return sample},
    downloads:async()=>downloads,
    mcp:async()=>({callTool:async()=>{const e=new Error("unsupported");e.code="unsupported";throw e}})
  };
  window.claude={use:n=>apis[n]?apis[n]():Promise.resolve(null)};

  /* ---------- Cài như app (PWA) ---------- */
  if("serviceWorker" in navigator&&location.protocol==="https:"){
    addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
  }
})();
