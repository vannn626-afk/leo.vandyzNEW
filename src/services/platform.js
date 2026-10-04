import {db,rpc,getSession,profile} from './supabase';

export async function getMyProfile(){const s=getSession(); if(!s?.access_token)return null; try{await rpc('sync_access_state',{},s.access_token);return await profile(s.access_token)}catch(e){if(String(e?.message||'').includes('SESSION_PROFILE_MISMATCH'))throw new Error('Session tidak cocok dengan profil akun. Silakan login ulang.');return null}}
export async function touchPresence(){try{await rpc('touch_presence',{},getSession()?.access_token)}catch{}}
export async function consumeTool(toolId,cost=10){
  const token=getSession()?.access_token; if(!token)throw new Error('Session expired.');
  // VIP/ADMIN enforcement must happen in the canonical server-side RPC.
  // Do not fall back to an older consume_tool implementation that may not know vip_until.
  try{return await rpc('consume_tool_v2',{p_tool_id:toolId,p_cost:cost},token)}catch(e){
    const m=String(e?.message||'');
    if(m.includes('INSUFFICIENT_CREDITS'))throw new Error('Credits tidak cukup.');
    if(m.includes('ACCOUNT_DISABLED'))throw new Error('Akun dinonaktifkan.');
    if(m.includes('SESSION_EXPIRED'))throw new Error('Session expired. Login kembali.');
    throw new Error(m||'Tool tidak dapat digunakan.');
  }
}
export async function getPublicStats(){try{return await rpc('public_stats',{},getSession()?.access_token)}catch{return null}}
export async function getAdminStats(){try{return await rpc('admin_stats',{},getSession()?.access_token)}catch{return null}}
export async function listRows(table,query='?select=*'){return db(table,{token:getSession()?.access_token,query})}
export async function mutate(table,method,body,query=''){return db(table,{token:getSession()?.access_token,method,body,query,prefer:'return=representation'})}
export async function adminRpc(name,args){return rpc(name,args,getSession()?.access_token)}
export async function rejectOrder(orderId){return adminRpc('reject_order',{p_order_id:orderId})}
export async function setUserDisabled(userId,disabled){return adminRpc('set_user_disabled',{p_user_id:userId,p_disabled:Boolean(disabled)})}
export async function setUserRole(userId,role){return adminRpc('set_user_role',{p_user_id:userId,p_role:role})}
export async function createOrder(product,price,credits=0,vip_days=0){return adminRpc('create_order',{p_product:product,p_price:Number(price),p_credits:Number(credits),p_vip_days:Number(vip_days)})}
