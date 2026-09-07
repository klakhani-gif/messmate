import {backendConfig} from '../../../lib/runtime';
import {rest} from '../../../lib/supabase';
import {sameOrigin,validateEnquiry,InputError} from '../../../lib/validation';
export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin'},{status:403});
  if(Number(request.headers.get('content-length')||0)>12000)return Response.json({error:'Request too large'},{status:413});
  try{
    const text=await request.text();if(text.length>10000)return Response.json({error:'Request too large'},{status:413});
    let raw:unknown;try{raw=JSON.parse(text)}catch{return Response.json({error:'Invalid form data'},{status:400})}
    const enquiry=validateEnquiry(raw);
    const response=await rest(backendConfig(),'rpc/messmate_submit_enquiry',{method:'POST',body:JSON.stringify({p_data:enquiry})});
    if(!response.ok){const error=await response.json() as {message?:string};if(error.message==='enquiry_rate_limit')return Response.json({error:'Too many enquiries. Please try again in an hour.'},{status:429});throw new Error('Storage failed')}
    const id=await response.json();return Response.json({id},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch(error){if(error instanceof InputError)return Response.json({error:error.message},{status:400});return Response.json({error:'Unable to save right now. Please try again shortly.'},{status:503})}
}
