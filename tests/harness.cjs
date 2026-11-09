const fs = require('node:fs');
const vm = require('node:vm');
module.exports = function harness(saved = null) {
 const nodes = new Map(); const listeners = new Map();
 function node() { return {style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},remove(){},addEventListener(){},querySelectorAll(){return []},textContent:'',innerHTML:''}; }
 const document = {getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},createElement:node,body:node(),addEventListener(type, fn){listeners.set(type, fn)}};
 let id=0; const timers=new Map(); const storage={value:saved};
 const ctx=vm.createContext({document,window:{},console,localStorage:{getItem(){return storage.value},setItem(k,v){storage.value=v}},setTimeout(fn){timers.set(++id,fn);return id},clearTimeout(i){timers.delete(i)},setInterval(){return 0},clearInterval(){}});
 vm.runInContext(fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1],ctx);
 return {nodes,press(key,code=key){listeners.get('keydown')?.({key,code,preventDefault(){}})},run(s){return vm.runInContext(s,ctx)},flush(limit=100){let count=0;while(timers.size&&count++<limit){const [k,fn]=timers.entries().next().value;timers.delete(k);fn()}return timers.size},storage};
};
