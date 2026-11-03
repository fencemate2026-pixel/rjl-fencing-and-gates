import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const read = name => fs.readFileSync(new URL('../site/assets/'+name, import.meta.url), 'utf8');
const ga = read('ga.js'), contextCode = read('lead-context.js');
const commercial = ga.includes('G-E99T8R8JJ7');
function analytics(host = commercial ? 'www.rjlcommercialgroup.com' : 'www.rjlfencingandgates.com.au') {
  const handlers = {}, window = {addEventListener(){}};
  vm.runInNewContext(ga,{window,document:{referrer:'https://example.test/?email=private@example.test',addEventListener(k,v){handlers[k]=v;}},
    location:{hostname:host,origin:'https://'+host,pathname:'/contact',search:'?address=private'},URL,setTimeout(){}});
  return {window,handlers};
}
test('preview and local visits never initialise production analytics', () => {
  for (const host of ['localhost','terminal.local','deploy-preview-1--rjlcommercial.netlify.app','rjlfencingandgates.netlify.app']) {
    assert.equal(analytics(host).window.dataLayer,undefined);
  }
});
test('accepted leads are deduplicated and customer fields are discarded', () => {
  const {window,handlers}=analytics();
  const form=commercial?'free-site-report':'residential-quote';
  const event={detail:{form,name:'Private Person',email:'private@example.test',message:'private'}};
  handlers['rjl:quote-submitted'](event);handlers['rjl:quote-submitted'](event);
  const events=window.dataLayer.filter(x=>x[0]==='event'&&x[1]==='generate_lead');
  assert.equal(events.length,1);assert.equal(events[0][2].form_name,form);
  assert.equal(JSON.stringify(window.dataLayer).toLowerCase().includes('private'),false);
});
function attribution({search='?utm_source=google&utm_medium=cpc&utm_campaign=gate-repairs&email=private@example.test&address=private',storage=new Map(),blocked=false}={}) {
  const fields=Object.fromEntries(['lead_id','lead_source','lead_medium','lead_campaign','lead_landing','lead_referrer'].map(k=>[k,{value:''}]));
  const form={getAttribute(){return commercial?'site-assessment':'residential-quote';},querySelector(s){return fields[s.match(/name="([^"]+)/)?.[1]];}};
  const sessionStorage={getItem(k){if(blocked)throw Error('blocked');return storage.get(k)||null;},setItem(k,v){if(blocked)throw Error('blocked');storage.set(k,v);}};
  vm.runInNewContext(contextCode,{window:{crypto:{randomUUID(){return 'b76290a2-b962-4b20-bce1-9ab877bc5fc1';}}},
    document:{readyState:'complete',referrer:'https://www.google.com/search?q=private',querySelectorAll(){return[form];},addEventListener(){}},
    location:{origin:'https://rjl.example',hostname:'rjl.example',pathname:'/contact',href:'https://rjl.example/contact'+search,search},
    sessionStorage,URL,URLSearchParams,Date,Uint8Array});
  return {fields,storage};
}
test('first touch carries only bounded marketing fields, route and referring host', () => {
  const {fields,storage}=attribution();
  assert.equal(fields.lead_source.value,'google');assert.equal(fields.lead_medium.value,'cpc');
  assert.equal(fields.lead_campaign.value,'gate-repairs');assert.equal(fields.lead_landing.value,'/contact');
  assert.equal(fields.lead_referrer.value,'www.google.com');assert.match(fields.lead_id.value,/^[a-f0-9-]{36}$/);
  assert.equal(JSON.stringify([...storage.values()]).includes('private'),false);
  const second=attribution({search:'?utm_source=facebook',storage});
  assert.equal(second.fields.lead_source.value,'google');
});
test('invalid campaign values and unavailable storage do not affect the enquiry', () => {
  const {fields}=attribution({search:'?utm_source=private@example.test&utm_campaign=0400123456',blocked:true});
  assert.equal(fields.lead_source.value,'www.google.com');assert.equal(fields.lead_campaign.value,'');
  assert.ok(fields.lead_id.value);
});

if(commercial) {
  const code=read('quote-capture.js');
  function capture({response={ok:true},reject,files=[],honeypot='',hasFetch=true}={}) {
    const handlers={},events=[],requests=[];
    const button={disabled:false,innerHTML:'Send enquiry'},field={value:'Preserve this text',disabled:false};
    const status={hidden:true,classList:{toggle(){}},setAttribute(){},focus(){this.focused=true;}};
    const form={name:'site-assessment',dataset:{},elements:[button,field],hidden:false,
      querySelector(){return button;},insertAdjacentElement(){},addEventListener(n,h){handlers[n]=h;},reportValidity(){return true;},setAttribute(){},removeAttribute(){}};
    let selector='';
    const document={readyState:'complete',querySelectorAll(s){selector=s;return[form];},createElement(){return status;},dispatchEvent(e){events.push(e);}};
    class Data {constructor(){this.values={name:'RJL internal test',email:'info@rjlcommercialgroup.com','bot-field':honeypot,...Object.fromEntries(files.map((f,i)=>['file'+i,f]))};}get(k){return this.values[k];}forEach(fn){Object.values(this.values).forEach(fn);}}
    const fetch=async(url,options)=>{requests.push({url,options});if(reject)throw reject;return response;};
    vm.runInNewContext(code,{window:{fetch:hasFetch?fetch:null,FormData:Data},document,fetch,FormData:Data,
      CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},setTimeout(){return 1;},clearTimeout(){}});
    return {form,field,button,status,events,requests,selector,submit:()=>handlers.submit({preventDefault(){}})};
  }
  test('the commercial handler selects published forms without Netlify attributes', () => {
    const env=capture();assert.equal(env.selector,'form[name="site-assessment"], form[name="free-site-report"]');
  });
  test('a successful commercial request is sent and counted once', async () => {
    const e=capture();await e.submit();await e.submit();
    assert.equal(e.requests.length,1);assert.equal(e.form.hidden,true);
    assert.equal(e.requests[0].options.headers,undefined);
    assert.equal(e.events.filter(x=>x.type==='rjl:quote-submitted').length,1);
  });
  test('rejected and offline requests preserve details and permit a retry', async () => {
    for(const options of [{response:{ok:false}},{reject:new Error('offline')}]){
      const e=capture(options);await e.submit();await e.submit();
      assert.equal(e.requests.length,2);assert.equal(e.form.hidden,false);assert.equal(e.button.disabled,false);
      assert.equal(e.field.value,'Preserve this text');assert.equal(e.events.filter(x=>x.type==='rjl:quote-submitted').length,0);
    }
  });
  test('honeypot and invalid attachments do not create accepted lead events', async () => {
    for(const options of [{honeypot:'bot'},{files:[{name:'front.jpg',size:8*1024*1024}]},{files:[{name:'code.exe',size:12}]}]){
      const e=capture(options);await e.submit();assert.equal(e.requests.length,0);assert.equal(e.events.filter(x=>x.type==='rjl:quote-submitted').length,0);
    }
  });
  test('without fetch the native form action remains available', async () => {
    const e=capture({hasFetch:false});await e.submit();assert.equal(e.requests.length,0);assert.equal(e.form.hidden,false);
  });
}
