import { env } from 'cloudflare:workers';
import type { BackendConfig } from './supabase';
export function backendConfig(): BackendConfig {
  const values = env as unknown as Record<string, string | undefined>;
  const config = {url: values.SUPABASE_URL || '', publishableKey: values.SUPABASE_PUBLISHABLE_KEY || '', secretKey: values.SUPABASE_SECRET_KEY || '', adminEmail: values.ADMIN_EMAIL || ''};
  if (!config.url || !config.publishableKey || !config.secretKey || !config.adminEmail) throw new Error('Backend is not configured');
  const url = new URL(config.url);
  if (url.username || url.password || (url.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(url.hostname))) throw new Error('Invalid backend URL');
  config.url = url.origin;
  return config;
}
