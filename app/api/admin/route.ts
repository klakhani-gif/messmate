import {isAdmin} from '../../admin-auth';
import {backendConfig} from '../../../lib/runtime';
import {rest} from '../../../lib/supabase';
import {sameOrigin} from '../../../lib/validation';
export async function GET(){
  if(!await isAdmin())return Response.json({error:'Access denied'},{status:403});
  try{const r=await rest(backendConfig(),'messmate_enquiries?select=*&order=created_at.desc&limit=200');if(!r.ok)throw new Error('Read failed');return Response.json(await r.json(),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Could not load enquiries'},{status:503})}
}
export async function PATCH(request:Request){
  if(!sameOrigin(request)||!await isAdmin())return Response.json({error:'Access denied'},{status:403});
  try{
    const data=await request.json() as {id?:string,status?:string};
    if(!data||typeof data.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)||!['new','contacted','closed','delete'].includes(data.status||''))return Response.json({error:'Invalid update'},{status:400});
    const r=await rest(backendConfig(),'messmate_enquiries?id=eq.'+encodeURIComponent(data.id),data.status==='delete'?{method:'DELETE'}:{method:'PATCH',body:JSON.stringify({status:data.status})});
    if(!r.ok)throw new Error('Update failed');return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Update failed'},{status:503})}
}
