import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const siteCode = fs.readFileSync(new URL('../site/assets/site.js', import.meta.url), 'utf8');
const gaCode = fs.readFileSync(new URL('../site/assets/ga.js', import.meta.url), 'utf8');
function setup({ response = {ok: true}, rejection, files = [], query = '', design } = {}) {
  const handlers = {}, events = [], requests = [];
  const fields = {
    '#enquiry-address': {value: ''}, '#enquiry-message': {value: ''},
    '#enquiry-service': {options: [{text: 'Not sure — please advise'}, {text: 'Sliding & double gates'}], selectedIndex: 0}
  };
  const button = {disabled: false, innerHTML: 'Send quote request', textContent: ''};
  const status = {hidden: true, setAttribute(){}, focus(){this.focused=true;}};
  const form = {
    elements: [button, ...Object.values(fields)], hidden: false,
    addEventListener(name, handler){handlers[name]=handler;},
    querySelector(selector){return selector === 'button[type="submit"]' ? button : fields[selector];},
    reportValidity(){return true;}, setAttribute(){}, removeAttribute(){}, insertBefore(){}, scrollIntoView(){}
  };
  const document = {
    querySelector(s){return s === '.email-enquiry form' ? form : s === '#quote-status' ? status : null;},
    querySelectorAll(){return [];}, dispatchEvent(e){events.push(e);},
    createElement(){return {};}
  };
  class Data {
    constructor(){this.values = {'name': 'Test customer', message: 'Project details', 'site-photo': files[0], 'site-plan': files[1]};}
    get(key){return this.values[key];}
  }
  const fetch = async (url, options) => {requests.push({url, options}); if(rejection) throw rejection; return response;};
  const location = {search: query, href: 'https://example.test/contact-us'+query};
  const context = {
    document, FormData: Data, CustomEvent: class {constructor(type, options){this.type=type;this.detail=options.detail;}},
    URLSearchParams, URL, Number, Date, fetch,
    window: {fetch, FormData: Data, location, history: {replaceState(){}}},
    sessionStorage: {getItem(key){return key === 'rjl-design-quote' && design ? JSON.stringify(design) : null;},removeItem(){}},
    setTimeout(){return 1;}, clearTimeout(){}
  };
  vm.runInNewContext(siteCode, context);
  return {handlers,events,requests,form,fields,status,button, submit: () => handlers.submit({preventDefault(){}})};
}
test('only an accepted POST confirms receipt and emits a lead once', async () => {
  const env = setup();
  await env.submit(); await env.submit();
  assert.equal(env.requests.length,1); assert.equal(env.requests[0].options.method,'POST');
  assert.equal(env.requests[0].options.headers,undefined,'browser must set the multipart boundary');
  assert.equal(env.form.hidden,true); assert.equal(env.status.focused,true);
  assert.equal(env.events.filter(e=>e.type==='rjl:quote-submitted').length,1);
  assert.equal(env.events.filter(e=>e.type==='rjl:quote-start').length,1);
  assert.match(env.status.textContent,/submitted/);
});
test('server rejection retains the form, restores controls, emits no lead and permits retry', async () => {
  const env = setup({response: {ok:false}}); env.fields['#enquiry-message'].value='Retain my project';
  await env.submit(); await env.submit();
  assert.equal(env.requests.length,2); assert.equal(env.form.hidden,false); assert.equal(env.button.disabled,false);
  assert.equal(env.fields['#enquiry-message'].value,'Retain my project');
  assert.equal(env.events.filter(e=>e.type==='rjl:quote-submitted').length,0);
  assert.match(env.status.textContent,/couldn’t confirm/);
});
test('network failure does not claim receipt', async () => {
  const env = setup({rejection: new Error('offline')}); await env.submit();
  assert.equal(env.form.hidden,false); assert.equal(env.button.disabled,false);
  assert.equal(env.events.filter(e=>e.type==='rjl:quote-submitted').length,0);
});
test('oversized or unsupported attachments never POST', async () => {
  const large = setup({files:[{name:'front.jpg',size:5*1024*1024},{name:'plan.pdf',size:3*1024*1024}]});
  await large.submit(); assert.equal(large.requests.length,0); assert.match(large.status.textContent,/over 7 MB/);
  const bad = setup({files:[{name:'program.exe',size:100}]});
  await bad.submit(); assert.equal(bad.requests.length,0); assert.match(bad.status.textContent,/PDF plan/);
});
test('allowlisted project/service links prefill while arbitrary query text is ignored', () => {
  const valid = setup({query:'?project=sliding-driveway-gate&service=Sliding%20%26%20double%20gates'});
  assert.match(valid.fields['#enquiry-message'].value,/Custom sliding driveway gate/);
  assert.equal(valid.fields['#enquiry-service'].selectedIndex,1);
  const invalid=setup({query:'?project=%3Cscript%3E&service=bad'});
  assert.equal(invalid.fields['#enquiry-message'].value,'');
  assert.equal(invalid.fields['#enquiry-service'].selectedIndex,0);
});
test('existing design-to-quote handover still prefills the request', () => {
  const env=setup({design:{text:'Design from the 3D designer: 12 m fence.',service:'Sliding & double gates'}});
  assert.match(env.fields['#enquiry-message'].value,/12 m fence/);
  assert.equal(env.fields['#enquiry-service'].selectedIndex,1);
  assert.equal(env.events.filter(e=>e.type==='rjl:design-quote-added').length,1);
});
test('analytics excludes personal query values and ignores the retired email-prepared event', () => {
  const handlers={},document={referrer:'https://example.test/?email=private@example.test',addEventListener(k,v){handlers[k]=v;}};
  const location={hostname:'www.rjlfencingandgates.com.au',origin:'https://www.rjlfencingandgates.com.au',pathname:'/contact-us',search:'?address=private'};
  const window={addEventListener(){}};
  vm.runInNewContext(gaCode,{document,window,location,URL,setTimeout(){}});
  assert.equal(handlers['rjl:enquiry-ready'],undefined);
  handlers['rjl:quote-submitted']({detail:{name:'Private Person',email:'private@example.test'}});
  const event=window.dataLayer.find(args=>args[0]==='event' && args[1]==='generate_lead');
  assert.equal(event[2].form_name,'residential-quote');
  const payload=JSON.stringify(window.dataLayer);
  assert.equal(payload.includes('private'),false); assert.equal(payload.includes('Private Person'),false);
});
test('Core Web Vitals report bounded measurements, deduplicate repeats and omit page/customer details', () => {
  const callbacks={},scripts=[];
  const document={referrer:'https://example.test/?address=private',addEventListener(){},createElement(){return {};},head:{appendChild(script){scripts.push(script);}}};
  const location={hostname:'www.rjlfencingandgates.com.au',origin:'https://www.rjlfencingandgates.com.au',pathname:'/',search:'?email=private@example.test'};
  const window={addEventListener(){},PerformanceObserver:function(){},webVitals:{onLCP(fn){callbacks.LCP=fn;},onINP(fn){callbacks.INP=fn;},onCLS(fn){callbacks.CLS=fn;}}};
  vm.runInNewContext(gaCode,{document,window,location,URL,setTimeout(){}});
  assert.equal(scripts[0].src,'/assets/vendor/web-vitals-6.2.3.js');scripts[0].onload();
  const metric={name:'LCP',value:2100,delta:2100,id:'v6-123-456',rating:'good',entries:[{name:'private@example.test',target:{value:'Private Person'}}]};
  callbacks.LCP(metric);callbacks.LCP(metric);
  callbacks.INP({...metric,name:'INP',value:75,delta:75});
  callbacks.CLS({...metric,name:'CLS',value:0.005,delta:0.005});
  callbacks.LCP({...metric,id:'private@example.test'});callbacks.LCP({...metric,value:NaN});
  const events=window.dataLayer.filter(args=>args[0]==='event');assert.equal(events.length,3);
  assert.equal(events[0][2].metric_value,2100);assert.equal(events[2][2].metric_value,0.005);
  assert.equal(JSON.stringify(window.dataLayer).includes('private'),false);assert.equal(JSON.stringify(window.dataLayer).includes('Private Person'),false);
});
