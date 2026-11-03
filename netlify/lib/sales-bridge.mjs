/* Server-only Netlify verified-submission bridge. Never import in browser code. */
export const INGEST_URL='https://aevsfrxqyvtuycufffxk.supabase.co/functions/v1/rjl-sales-ingest';
const forms={residential:new Set(['residential-quote','photo-visualiser']),commercial:new Set(['site-assessment','free-site-report','photo-visualiser','property-address-quote'])};
const fields=['name','company','email','phone','site_address','address','site','property-address','postcode','service','product','details','message','site_type','urgency','timing','site_count','asset_count','approx_length_m','approx_height_m','budget_aud','unit','suburb','state','address-confirmed','consent','lead_id','lead_source','lead_medium','lead_campaign','lead_landing','lead_referrer','bot-field','form-name'];
export const enabled=env=>env.RJL_SALES_ENABLED==='true'&&/^[a-f0-9]{64}$/.test(env.RJL_SALES_INGEST_TOKEN||'');

export function envelope(payload,brand) {
  const form=payload?.form_name||payload?.data?.['form-name'];
  if(!forms[brand]?.has(form)) return null;
  if(typeof payload.id!=='string'||!/^[a-z0-9_-]{3,120}$/i.test(payload.id)) throw new Error('Host submission ID missing');
  const data={};
  for(const field of fields) if(typeof payload.data?.[field]==='string') data[field]=payload.data[field].slice(0,4000);
  for(const field of ['site-photo','site-plan','concept-image','ai-image']) if(payload.data?.[field]) data[field]='File supplied; access original in Netlify Forms';
  return {brand,submission:{id:payload.id,form_name:form,created_at:payload.created_at,data}};
}

async function deliver(message,token,fetcher) {
  const response=await fetcher(INGEST_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(message),signal:AbortSignal.timeout(12000)});
  return response.status;
}

export async function enqueueVerified(payload,brand,{store,env,fetcher=fetch}) {
  if(!enabled(env)) return {state:'not_configured'};
  const message=envelope(payload,brand);
  if(!message) return {state:'ignored_form'};
  const key='pending/'+message.submission.id;
  // Save before the network call. A temporary outage cannot discard the accepted lead.
  await store.setJSON(key,message);
  try {
    const status=await deliver(message,env.RJL_SALES_INGEST_TOKEN,fetcher);
    if(status>=200&&status<300){await store.delete(key);return {state:'delivered'};}
    return {state:'queued',status};
  } catch {return {state:'queued'};}
}

export async function retryPending({store,env,fetcher=fetch}) {
  if(!enabled(env)) return {state:'not_configured',delivered:0,review:0};
  const list=await store.list({prefix:'pending/'});
  let delivered=0,review=0;
  for(const item of list.blobs.slice(0,100)) {
    const message=await store.get(item.key,{type:'json'});
    if(!message) continue;
    try {
      const status=await deliver(message,env.RJL_SALES_INGEST_TOKEN,fetcher);
      if(status>=200&&status<300){await store.delete(item.key);delivered++;}
      else if(status===422||status===400){await store.setJSON(item.key.replace('pending/','review/'),{...message,delivery_error:status});await store.delete(item.key);review++;}
      else break; // Shared outage or credential failure: keep the queue and retry later.
    } catch {break;}
  }
  return {state:'processed',delivered,review};
}
