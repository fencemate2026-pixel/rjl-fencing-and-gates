const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const base=require('node:path').join(__dirname,'../site/assets/');
function context(extra={}){
 const c={console,Blob,URL,Promise,queueMicrotask,location:{hostname:'www.rjlfencingandgates.com.au'},...extra};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(base+'vendor/three.min.js','utf8'),c);vm.runInContext(fs.readFileSync(base+'photo-visualiser-ar.js','utf8'),c);return c;
}
(async()=>{
 const c=context();const T=c.THREE,root=new T.Group();root.scale.setScalar(.001);root.position.set(15,0,7);root.rotation.y=.3;const mesh=new T.Mesh(new T.BoxGeometry(1000,2000,100),new T.MeshStandardMaterial({color:0xff6600}));mesh.position.set(1000,1000,-400);root.add(mesh);root.updateMatrixWorld(true);
 const prepared=c.RJLVizAR.model(root);prepared.updateMatrixWorld(true);const b=new T.Box3().setFromObject(prepared),size=b.getSize(new T.Vector3());
 assert(Math.abs(size.x-1)<1e-7&&Math.abs(size.y-2)<1e-7&&Math.abs(size.z-.1)<1e-7);assert(Math.abs(b.min.y)<1e-7);assert(Math.abs((b.min.x+b.max.x)/2)<1e-7);console.log('PASS model units:1000×2000×100mm becomes1×2×0.1m; ground aligned and centered; root world transform excluded.');
 let loads=0;const n=context({document:{createElement(){return{};},head:{appendChild(el){loads++;queueMicrotask(()=>el.onerror());}}}});
 await n.RJLVizAR.prepare().catch(()=>{});await n.RJLVizAR.prepare().catch(()=>{});assert.equal(loads,2);console.log('PASS failed AR libraries can be retried.');
 let ended=0,disposed=0,removed=0;
 const w=context({navigator:{xr:{requestSession(){return Promise.resolve({addEventListener(){},requestReferenceSpace(){return Promise.reject(Error('reference space failure'));},end(){ended++;return Promise.resolve();}});}}},document:{createElement(){return {querySelector(){return{addEventListener(){}};},remove(){removed++;}};},body:{appendChild(){}}}});
 w.THREE.WebGLRenderer=class{constructor(){this.xr={enabled:false,setReferenceSpaceType(){},setSession(){return Promise.resolve();}};this.shadowMap={};}setPixelRatio(){}setSize(){}setAnimationLoop(){}dispose(){disposed++;}};
 const wr=new w.THREE.Group();wr.scale.setScalar(.001);wr.add(new w.THREE.Mesh(new w.THREE.BoxGeometry(1000,1000,100),new w.THREE.MeshStandardMaterial()));
 await w.RJLVizAR.startWebXR(wr).catch(()=>{});assert.equal(removed,1);assert.equal(disposed,1);assert.equal(ended,1);console.log('PASS failed XR startup ends the active session and cleans up once.');
 const photo=fs.readFileSync(base+'photo-visualiser.js','utf8');
 const handler=photo.slice(photo.indexOf('ie.addEventListener("click",'),photo.indexOf('oe.addEventListener("click",'));
 let click,started=0,phase='preparing';
 const button={getAttribute(){return 'webxr';},addEventListener(type,fn){click=fn;}};
 const api={startWebXR(){assert.equal(phase,'fresh user tap');started++;return Promise.resolve();}};
 const ui={ie:button,ze:true,n:{model:{}},dt:{product:'slats'},Gt(){return 2;},jt(){},Yt(){},Pt(){},wn(){return Promise.resolve(api);},Promise,JSON};
 vm.createContext(ui);vm.runInContext(handler.slice(0,-1)+';',ui);
 click();await new Promise(resolve=>setImmediate(resolve));assert.equal(started,0);assert.equal(button.textContent,'Open AR');
 phase='fresh user tap';click();assert.equal(started,1);await new Promise(resolve=>setImmediate(resolve));
 console.log('PASS immersive session request runs synchronously from a fresh tap after dependency preparation.');
})().catch(e=>{console.error(e);process.exit(1)});
