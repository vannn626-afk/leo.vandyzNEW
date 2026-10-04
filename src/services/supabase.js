const URL = import.meta.env.VITE_SUPABASE_URL || '';
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const STORAGE = 'king-vandyz-supabase-session-v2';
const LEGACY_STORAGE = 'king-vandyz-supabase-session-v1';
// Persist auth across reloads/browser restarts.
// The V15.1 tab-only session caused users to be logged out after closing/reopening
// the browser. Keep the auth session in localStorage and migrate any legacy tab
// session once, without touching favorites/history/theme storage.
const storageGet=(key)=>{try{return localStorage.getItem(key)}catch{return null}};
const storageSet=(key,value)=>{try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch{}};
const storageMigrate=()=>{try{const current=localStorage.getItem(STORAGE);if(current)return current;const tab=sessionStorage.getItem(STORAGE);if(tab){localStorage.setItem(STORAGE,tab);sessionStorage.removeItem(STORAGE);return tab}const legacy=localStorage.getItem(LEGACY_STORAGE);if(legacy){localStorage.setItem(STORAGE,legacy);localStorage.removeItem(LEGACY_STORAGE);return legacy}}catch{}return null};
const AUTH_COOLDOWN = 'king-vandyz-auth-cooldown-until';
function authCooldownRemaining(){try{return Math.max(0,Number(localStorage.getItem(AUTH_COOLDOWN)||0)-Date.now())}catch{return 0}}
function markAuthRateLimit(){try{localStorage.setItem(AUTH_COOLDOWN,String(Date.now()+20000))}catch{}}
function throwCooldown(){const ms=authCooldownRemaining();if(ms>0){const e=new Error('AUTH_COOLDOWN');e.status=429;e.retryAfter=Math.ceil(ms/1000);throw e}}
async function authRequest(url,options={}){throwCooldown();try{return await request(url,options)}catch(e){if(e?.status===429)markAuthRateLimit();throw e}}

export const isSupabaseConfigured = Boolean(URL && KEY);
const authBase = () => `${URL.replace(/\/$/, '')}/auth/v1`;
const restBase = () => `${URL.replace(/\/$/, '')}/rest/v1`;

function headers(token) {
  return { apikey: KEY, Authorization: `Bearer ${token || KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' };
}
function readSession(){try{return JSON.parse(storageMigrate()||'null')}catch{return null}}
function saveSession(s){storageSet(STORAGE,s?JSON.stringify(s):null)}

async function request(url, options={}) {
  const r = await fetch(url, options);
  const text = await r.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) { const e = new Error(data?.msg || data?.message || data?.error_description || data?.error || `Request failed (${r.status})`); e.status=r.status; e.data=data; throw e; }
  return data;
}

export async function signUp(username, password){
  if(!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');
  const u=String(username||'').trim().toLowerCase();
  if(!/^[a-z][a-z0-9_-]{2,31}$/.test(u)) throw new Error('Username harus 3–32 karakter, diawali huruf. Angka, garis bawah, dan minus bersifat opsional.');
  if(String(password||'').length<8) throw new Error('Password minimal 8 karakter.');
  const email=`${u}@auth.vandyz.com`;
  const data=await authRequest(`${authBase()}/signup`,{method:'POST',headers:headers(),body:JSON.stringify({email,password,data:{username:u}})});
  if(data?.session){ saveSession(data.session); return data; }
  // Do not auto-login or retry here. A successful signup can return a user
  // without a session; the UI will ask the user to Login.
  return data;
}
export async function signIn(username,password){
  if(!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');
  const u=String(username||'').trim().toLowerCase();
  const email=`${u}@auth.vandyz.com`;
  const data=await authRequest(`${authBase()}/token?grant_type=password`,{method:'POST',headers:headers(),body:JSON.stringify({email,password})});
  saveSession(data); return data;
}
export async function signOut(){saveSession(null)}
export function getSession(){return readSession()}
export async function restoreSession(){
  const s=readSession(); if(!s?.access_token)return null;
  if(s.expires_at && Date.now()/1000 < s.expires_at-45)return s;
  if(!s.refresh_token)return null;
  try{const next=await request(`${authBase()}/token?grant_type=refresh_token`,{method:'POST',headers:headers(),body:JSON.stringify({refresh_token:s.refresh_token})});saveSession(next);return next}catch{saveSession(null);return null}
}
export async function db(path,{method='GET',token,body,query='',prefer='return=representation'}={}){
  const s=token||readSession()?.access_token;
  return request(`${restBase()}/${path}${query}`,{method,headers:{...headers(s),Prefer:prefer},body:body===undefined?undefined:JSON.stringify(body)});
}
export async function rpc(name,args={},token){return db(`rpc/${name}`,{method:'POST',token,body:args,prefer:'return=representation'})}
function tokenSubject(token){
  try{
    const part=String(token||'').split('.')[1];
    if(!part)return null;
    const b64=part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'=');
    const payload=JSON.parse(decodeURIComponent(Array.from(atob(b64),c=>`%${c.charCodeAt(0).toString(16).padStart(2,'0')}`).join('')));
    return typeof payload?.sub==='string'&&payload.sub?payload.sub:null;
  }catch{return null}
}
export async function profile(token){
  const uid=tokenSubject(token||readSession()?.access_token);
  if(!uid)return null;
  // NEVER select an arbitrary profile. The profile MUST match the authenticated
  // Supabase user id carried by the access token. This prevents one account
  // (for example jokowi) from being displayed for another account (kielvan).
  const rows=await db('profiles',{token,query:`?select=id,username,role,free_credits,purchased_credits,free_reset_at,vip_until,joined_at,last_active,tool_uses,disabled&id=eq.${encodeURIComponent(uid)}&limit=1`});
  const p=rows?.[0]||null;
  return p&&p.id===uid?p:null;
}
export function friendlyAuthError(e){
  const raw=String(e?.message||'');
  const m=raw.toLowerCase();
  if(m==='email_confirmation_required'||m.includes('email_confirmation_required')||m.includes('email not confirmed')||m.includes('confirm your email'))return 'Akun belum aktif karena Confirm Email masih menyala di Supabase. Matikan Authentication → Providers → Email → Confirm email, lalu coba daftar lagi.';
  if(m.includes('invalid login')||m.includes('invalid credentials')||m.includes('user not found')||m.includes('invalid password'))return 'Username atau password salah.';
  if(m.includes('already registered')||m.includes('already exists')||m.includes('duplicate'))return 'Username sudah digunakan. Coba username lain atau langsung Login.';
  if(m.includes('email address')||m.includes('invalid email'))return 'Username tidak valid. Gunakan 3–32 karakter, mulai dengan huruf. Angka, garis bawah, dan minus opsional.';
  if(m.includes('password'))return 'Password minimal 8 karakter.';
  if(e?.status===429||m.includes('rate limit')||m.includes('too many')||m.includes('auth_cooldown'))return `Login/Register sedang dibatasi sementara oleh Supabase. Tunggu sekitar ${e?.retryAfter||20} detik, lalu coba sekali saja.`;
  if(m.includes('signup')&&m.includes('disabled'))return 'Pendaftaran akun sedang dinonaktifkan di Supabase.';
  return raw && raw.length<180 ? raw : 'Terjadi kesalahan autentikasi. Coba lagi.';
}
