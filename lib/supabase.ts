export type BackendConfig = {url:string;publishableKey:string;secretKey:string;adminEmail:string};
export type AuthUser = {id:string;email?:string;email_confirmed_at?:string};
export const SESSION_COOKIE = 'messmate_session';
export function isAllowedAdmin(user:AuthUser|null, email:string):boolean {
  return Boolean(user?.id && user.email_confirmed_at && email && user.email?.toLowerCase() === email.toLowerCase());
}
function apiHeaders(key:string, token?:string):Headers {
  const headers = new Headers({'apikey':key,'Content-Type':'application/json'});
  // New sb_secret/sb_publishable keys are not JWTs. Legacy service-role keys are.
  if(token) headers.set('Authorization',`Bearer ${token}`);
  else if(key.startsWith('eyJ')) headers.set('Authorization',`Bearer ${key}`);
  return headers;
}
export async function verifyAdmin(config:BackendConfig, token:string, send:typeof fetch=fetch):Promise<AuthUser|null> {
  if(!token || token.length>8000)return null;
  const response=await send(config.url+'/auth/v1/user',{headers:apiHeaders(config.publishableKey,token),cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok)return null;
  const user=await response.json() as AuthUser;
  return isAllowedAdmin(user,config.adminEmail)?user:null;
}
export async function signIn(config:BackendConfig,email:string,password:string,send:typeof fetch=fetch){
  if(email.toLowerCase()!==config.adminEmail.toLowerCase()) return null;
  const response=await send(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:apiHeaders(config.publishableKey),body:JSON.stringify({email,password}),cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok)return null;
  const data=await response.json() as {access_token?:string;expires_in?:number};
  if(!data.access_token || !await verifyAdmin(config,data.access_token,send))return null;
  return {token:data.access_token,maxAge:Math.min(Math.max(Number(data.expires_in)||3600,1),3600)};
}
export function cookieHeader(token:string,maxAge:number,https:boolean){
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(maxAge)}${https?'; Secure':''}`;
}
export async function rest(config:BackendConfig,path:string,init:RequestInit={},send:typeof fetch=fetch){
  const response=await send(config.url+'/rest/v1/'+path,{...init,headers:apiHeaders(config.secretKey),cache:'no-store',signal:AbortSignal.timeout(12000)});
  return response;
}
