import test from 'node:test';
import assert from 'node:assert/strict';
import {envelope,enqueueVerified,retryPending} from '../netlify/lib/sales-bridge.mjs';
const brand=process.env.RJL_TEST_BRAND||'residential';
const form=brand==='residential'?'residential-quote':'site-assessment';
const payload={id:'host-verified-example-1',form_name:form,created_at:'2026-11-03T01:00:00Z',data:{name:'Internal test',email:'example@example.invalid',message:'Example','site-photo':'https://example.invalid/file?token=private',password:'never copy'}};
const env={RJL_SALES_ENABLED:'true',RJL_SALES_INGEST_TOKEN:'a'.repeat(64)};
function storage(){const rows=new Map();return {rows,async setJSON(key,value){rows.set(key,value);},async get(key){return rows.get(key);},async delete(key){rows.delete(key);},async list(){return {blobs:[...rows.keys()].filter(key=>key.startsWith('pending/')).map(key=>({key}))};}};}
test('bridge waits for explicit server configuration and ignores unrelated forms',async()=>{
 const store=storage();assert.equal((await enqueueVerified(payload,brand,{store,env:{}})).state,'not_configured');assert.equal(store.rows.size,0);
 assert.equal(envelope({...payload,form_name:'unrelated'},brand),null);
 assert.throws(()=>envelope({...payload,id:''},brand));
});
test('outage retains the accepted submission and a successful retry removes it',async()=>{
 const store=storage();const first=await enqueueVerified(payload,brand,{store,env,fetcher:async()=>{throw new Error('offline');}});
 assert.equal(first.state,'queued');assert.equal(store.rows.size,1);
 const queued=[...store.rows.values()][0];assert.equal(queued.submission.id,payload.id);assert.equal(queued.submission.data.password,undefined);assert.ok(!JSON.stringify(queued).includes('token=private'));
 const result=await retryPending({store,env,fetcher:async()=>({status:201})});assert.equal(result.delivered,1);assert.equal(store.rows.size,0);
});
test('invalid records are retained for review and credential failures leave the queue intact',async()=>{
 const store=storage();await enqueueVerified(payload,brand,{store,env,fetcher:async()=>({status:401})});
 assert.equal((await retryPending({store,env,fetcher:async()=>({status:401})})).delivered,0);assert.ok(store.rows.has('pending/'+payload.id));
 assert.equal((await retryPending({store,env,fetcher:async()=>({status:422})})).review,1);assert.ok(store.rows.has('review/'+payload.id));
});
