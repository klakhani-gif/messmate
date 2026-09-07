export class InputError extends Error {}
export type Enquiry={kind:'student'|'partner';name:string;email:string;area:string;details:string;provider:string};
export function validateEnquiry(raw:unknown):Enquiry {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError('Please check your details.');
  const data=raw as Record<string,unknown>;
  if(data.website)throw new InputError('Unable to submit.');
  const out:Record<string,string>={};
  for(const [key,max] of Object.entries({name:100,email:200,area:150,details:2500})){
    const value=data[key];
    if(typeof value!=='string'||!value.trim()||value.length>max)throw new InputError('Please check the '+key+' field.');
    out[key]=value.trim();
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)||!['student','partner'].includes(String(data.kind))||typeof data.provider!=='string'||data.provider.length>100)throw new InputError('Please check your details.');
  return {...out,kind:data.kind,provider:data.provider,email:out.email.toLowerCase()} as Enquiry;
}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
