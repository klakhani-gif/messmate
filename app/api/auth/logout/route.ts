import {cookieHeader} from '../../../../lib/supabase';
import {sameOrigin} from '../../../../lib/validation';
export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin'},{status:403});
  return Response.json({ok:true},{headers:{'Set-Cookie':cookieHeader('',0,new URL(request.url).protocol==='https:'),'Cache-Control':'no-store'}});
}
