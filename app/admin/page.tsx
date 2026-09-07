import {isAdmin} from '../admin-auth';
import {chatGPTSignInPath} from '../chatgpt-auth';
import Dashboard from './dashboard';
export const dynamic='force-dynamic';
export default async function Page(){if(!await isAdmin())return <main className="form-shell"><a className="back" href="/">← MessMate</a><h1>Administrator access</h1><p>This dashboard is restricted to the configured owner. Sign in with the authorised account. If an owner has not been configured, access remains closed.</p><a className="primary-button" href={chatGPTSignInPath('/admin')} target="_top">Sign in with ChatGPT</a></main>;return <Dashboard/>}
