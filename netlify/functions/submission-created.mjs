import { getStore } from '@netlify/blobs';
import { enabled, enqueueVerified } from '../lib/sales-bridge.mjs';

// Netlify verifies the event signature before invoking this reserved event function.
export default async function handler(request) {
  if(!enabled(process.env)) return new Response(null,{status:204});
  const {payload}=await request.json();
  const result=await enqueueVerified(payload,'residential',{store:getStore({name:'rjl-sales-outbox',consistency:'strong'}),env:process.env});
  if(result.state==='queued') console.warn('RJL sales import queued for retry');
  return new Response(null,{status:result.state==='queued'?202:204});
}
