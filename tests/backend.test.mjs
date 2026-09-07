import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyAdmin,signIn,isAllowedAdmin,cookieHeader,rest} from '../lib/supabase.ts';
import {validateEnquiry,InputError,sameOrigin} from '../lib/validation.ts';
const config={url:'https://test.supabase.co',publishableKey:'sb_publishable_test',secretKey:'sb_secret_test',adminEmail:'owner@example.test'};
const user={id:'user-1',email:config.adminEmail,email_confirmed_at:'2026-01-01'};
test('only confirmed allowlisted identities are admins',()=>{
  assert.equal(isAllowedAdmin(user,config.adminEmail),true);
  assert.equal(isAllowedAdmin({...user,email:'stranger@example.test'},config.adminEmail),false);
  assert.equal(isAllowedAdmin({...user,email_confirmed_at:undefined},config.adminEmail),false);
  assert.equal(isAllowedAdmin(user,''),false);
});
test('forged or expired sessions are denied by the auth server',async()=>{
  const send=async(url,init)=>{assert.ok(String(url).endsWith('/auth/v1/user'));assert.equal(init.headers.get('Authorization'),'Bearer forged');return new Response('{}',{status:401})};
  assert.equal(await verifyAdmin(config,'forged',send),null);
});
test('password login verifies the issued token before creating a session',async()=>{
  let calls=0;
  const send=async(url,init)=>{calls++;if(String(url).includes('/token?')){assert.deepEqual(JSON.parse(init.body),{email:config.adminEmail,password:'test-only-password'});return Response.json({access_token:'issued-token',expires_in:7200})}assert.equal(init.headers.get('Authorization'),'Bearer issued-token');return Response.json(user)};
  const session=await signIn(config,config.adminEmail,'test-only-password',send);
  assert.deepEqual(session,{token:'issued-token',maxAge:3600});assert.equal(calls,2);
});
test('a non-admin cannot obtain a session even with a token response',async()=>{
  const send=async(url)=>String(url).includes('/token?')?Response.json({access_token:'token'}):Response.json({...user,email:'other@example.test'});
  assert.equal(await signIn(config,config.adminEmail,'password',send),null);
});
test('secure cookies are httpOnly and logout expires them',()=>{
  assert.match(cookieHeader('token',3600,true),/HttpOnly; SameSite=Strict; Max-Age=3600; Secure/);
  assert.match(cookieHeader('',0,true),/Max-Age=0/);
  assert.doesNotMatch(cookieHeader('token',3600,false),/; Secure/);
});
test('new secret key is an apikey, never an invalid bearer JWT',async()=>{
  await rest(config,'messmate_enquiries',{},async(url,init)=>{assert.equal(init.headers.get('apikey'),config.secretKey);assert.equal(init.headers.get('Authorization'),null);return Response.json([])});
});
test('valid enquiries normalize email and reject abusive payloads',()=>{
  const data={kind:'student',name:' Student ',email:'TEST@example.test',area:'Isani',details:'Lunch',provider:''};
  assert.equal(validateEnquiry(data).email,'test@example.test');
  assert.throws(()=>validateEnquiry({...data,details:'x'.repeat(2501)}),InputError);
  assert.throws(()=>validateEnquiry({...data,website:'spam'}),InputError);
  assert.throws(()=>validateEnquiry(null),InputError);
  assert.throws(()=>validateEnquiry({...data,kind:'admin'}),InputError);
});
test('mutations reject missing or foreign origins',()=>{
  assert.equal(sameOrigin(new Request('https://messmate.test/api',{headers:{origin:'https://messmate.test'}})),true);
  assert.equal(sameOrigin(new Request('https://messmate.test/api',{headers:{origin:'https://other.test'}})),false);
  assert.equal(sameOrigin(new Request('https://messmate.test/api')),false);
});
