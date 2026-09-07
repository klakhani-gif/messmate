import {isAdmin} from '../admin-auth';
import Dashboard from './dashboard';
import Login from './login';
export const dynamic='force-dynamic';
export default async function Page(){return await isAdmin()?<Dashboard/>:<Login/>}
