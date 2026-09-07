import { cookies } from 'next/headers';
import { backendConfig } from '../lib/runtime';
import { SESSION_COOKIE, verifyAdmin } from '../lib/supabase';
export async function isAdmin(){
  try {const token=(await cookies()).get(SESSION_COOKIE)?.value;return Boolean(token && await verifyAdmin(backendConfig(),token));}
  catch {return false;}
}
