// Dedicated Pages Functions for SK Pekan Telipok — Pendaftaran Tahun 1 2027.
// Reuses the verified Google login on the school's existing OAuth hostname via
// one-time, short-lived exchange tickets. No other MaPeM API is exposed here.
import {handleRegistration2027} from './_registration2027.js';
const COOKIE='__Host-tahun1_2027_session';
const LEGACY_COOKIE='__Host-mapem_session';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff'};
const now=()=>Math.floor(Date.now()/1000);
const error=(msg,status=400)=>new Response(JSON.stringify({error:msg}),{status,headers});
const ok=(data)=>new Response(JSON.stringify(data),{headers});
const c=(value,seconds)=>COOKIE+'='+value+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+seconds;
const redirect=(url,extra={})=>new Response(null,{status:302,headers:{Location:url,'Cache-Control':'no-store','Referrer-Policy':'no-referrer',...extra}});
async function digest(value){
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
}
function cookieValue(req){const m=(req.headers.get('cookie')||'').match(/(?:^|;\s*)__Host-tahun1_2027_session=([a-f0-9]{64})(?:;|$)/);return m?.[1]||'';}
async function currentUser(req,env){
 const sid=cookieValue(req);if(!sid)return null;
 const row=await env.DB.prepare('SELECT u.sub,u.email,u.name FROM sessions s JOIN users u ON u.sub=s.user_sub WHERE s.id_hash=? AND s.expires_at>?').bind(await digest(sid),now()).first();
 if(!row)return null;
 const email=row.email.toLowerCase();
 const admins=String(env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase());
 const isMainAdmin=admins.includes(email)||!!(await env.DB.prepare('SELECT email FROM admin_grants WHERE email=?').bind(email).first());
 return {...row,role:isMainAdmin?'admin':'viewer'};
}
export async function onRequest({request,env}){
 const url=new URL(request.url),path=url.pathname.replace(/^\/api\/?/,'').replace(/\/$/,'');
 try{
  if(path==='health'&&request.method==='GET'){
   const databaseBound=!!env.DB;let databaseConnected=false;
   try{databaseConnected=!!(await env.DB.prepare('SELECT COUNT(*) AS n FROM registration_2027_students').first());}catch{}
   return ok({ok:true,databaseBound,databaseConnected,app:'Pendaftaran Tahun 1 2027'});
  }
  if(!env.DB)return error('Pangkalan data belum disambungkan.',503);
  if(path==='session/redeem'&&request.method==='GET'){
   const code=url.searchParams.get('code')||'';
   if(!/^[a-f0-9]{64}$/.test(code))return redirect('/?login=expired');
   const row=await env.DB.prepare('DELETE FROM registration_2027_login_transfers WHERE code_hash=? AND expires_at>? RETURNING user_sub').bind(await digest(code),now()).first();
   if(!row)return redirect('/?login=expired');
   const session=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
   await env.DB.prepare('INSERT INTO sessions(id_hash,user_sub,expires_at) VALUES(?,?,?)').bind(await digest(session),row.user_sub,now()+7*86400).run();
   return redirect('/',{'Set-Cookie':c(session,7*86400)});
  }
  const origin=request.headers.get('origin');
  if(!['GET','HEAD'].includes(request.method)&&origin!==url.origin)return error('Origin permintaan tidak sah.',403);
  if(path==='logout'&&request.method==='POST'){
   const sid=cookieValue(request);
   if(sid)await env.DB.prepare('DELETE FROM sessions WHERE id_hash=?').bind(await digest(sid)).run();
   return new Response(JSON.stringify({ok:true}),{headers:{...headers,'Set-Cookie':c('',0)}});
  }
  const user=await currentUser(request,env);
  if(!user)return error('Sila log masuk menggunakan Google.',401);
  if(path.startsWith('registration2027/'))return await handleRegistration2027({request,env,user,path});
  return error('Laluan tidak wujud.',404);
 }catch(e){
  if(e.status)return error(e.message,e.status);
  console.error('Registration portal API error',e);
  return error('Ralat pelayan. Sila cuba lagi.',500);
 }
}
