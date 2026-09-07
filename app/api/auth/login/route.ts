import { backendConfig } from '../../../../lib/runtime';
import { signIn, cookieHeader } from '../../../../lib/supabase';
import { sameOrigin } from '../../../../lib/validation';
export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin'},{status:403});
  try{
    const text=await request.text();if(text.length>3000)return Response.json({error:'Request too large'},{status:413});
    let data:Record<string,unknown>;try{data=JSON.parse(text)}catch{return Response.json({error:'Invalid login request'},{status:400})}
    if(!data||typeof data.email!=='string'||typeof data.password!=='string'||data.email.length>200||!data.password||data.password.length>1000)return Response.json({error:'Enter your email and password.'},{status:400});
    const session=await signIn(backendConfig(),data.email.trim(),data.password);
    if(!session)return Response.json({error:'Email or password is incorrect, or this account does not have admin access.'},{status:401,headers:{'Cache-Control':'no-store'}});
    return Response.json({ok:true},{headers:{'Set-Cookie':cookieHeader(session.token,session.maxAge,new URL(request.url).protocol==='https:'),'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Login is unavailable. Please check that the Supabase connection has been configured.'},{status:503})}
}
