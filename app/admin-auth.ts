import {getChatGPTUser} from './chatgpt-auth';
import {env} from 'cloudflare:workers';
export async function isAdmin(){const user=await getChatGPTUser();const allowed=(env as unknown as {ADMIN_EMAIL?:string}).ADMIN_EMAIL;return Boolean(user&&allowed&&user.email.toLowerCase()===allowed.toLowerCase());}
