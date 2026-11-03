import { getStore } from '@netlify/blobs';
import { enabled, retryPending } from '../lib/sales-bridge.mjs';
export const config={schedule:'15 * * * *'};
export default async function handler() {
  if(!enabled(process.env)) return new Response(null,{status:204});
  const result=await retryPending({store:getStore({name:'rjl-sales-outbox',consistency:'strong'}),env:process.env});
  if(result.review) console.warn('RJL sales import has records requiring review in the private outbox');
  return Response.json({delivered:result.delivered,review:result.review});
}
