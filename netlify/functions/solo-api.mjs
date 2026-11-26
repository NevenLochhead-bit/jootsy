import {getDatabase} from '@netlify/database';
import {getStore} from '@netlify/blobs';
import {createSoloService} from './lib/solo-service.mjs';

const env = key => globalThis.Netlify?.env.get(key) ?? process.env[key];
let database, service;

async function sendCode(email, code) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {authorization: `Bearer ${env('SOLO_RESEND_API_KEY')}`, 'content-type': 'application/json'},
    body: JSON.stringify({from: env('SOLO_EMAIL_FROM'), to: [email], subject: 'Your Jootsy Solo sign-in code',
      text: `Your Jootsy Solo code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`})
  });
  if (!response.ok) throw Error('Email delivery failed.');
}

export default async function handler(request, context = {}) {
  service ??= createSoloService({
    getPool: () => (database ??= getDatabase(env('NETLIFY_DB_URL') ? {connectionString: env('NETLIFY_DB_URL')} : undefined)).pool,
    getAssets: () => getStore({name: 'jootsy-solo-media', consistency: 'strong'}),
    getSecret: () => env('SOLO_AUTH_SECRET') || env('TOKEN_SECRET'),
    emailReady: () => Boolean(env('SOLO_RESEND_API_KEY') && env('SOLO_EMAIL_FROM')),
    sendCode
  });
  return service(request, context);
}

export const config = {path: ['/api/solo/*', '/solo-media/*']};
