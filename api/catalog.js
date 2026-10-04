import { KNOWN_TOOLS } from '../src/data/catalog.js';

const blocked=/primbon|jud[i1]ol|judi|casino|slot|betting|sports[- ]?bet|gambling|weapon|firearm|gun|narkoba|drug|cocaine|marijuana|thc|porn|nsfw|adult[- ]?sex|escort/i;
const credentialParam=/^(cookie|orgId|authorization|token|api[_-]?key|apikey|secret)$/i;
const internal=/^(session|session_id|conversation_id)$/i;
const category=(raw='')=>{const s=String(raw).toLowerCase();if(s.includes('ai'))return'ai';if(s.includes('image')||s.includes('gambar'))return'image';if(s.includes('video')||s.includes('hd'))return'hd-video';if(s.includes('download'))return'download';if(s.includes('maker'))return'maker';if(s.includes('anime'))return'anime';if(s.includes('search'))return'search';if(s.includes('developer')||s.includes('tools'))return'developer';if(s.includes('fun'))return'fun';if(s.includes('whatsapp'))return'whatsapp';return s.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'other'};
const slug=s=>String(s||'tool').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);
const label=n=>({text:'Text / Prompt',teks:'Text / Prompt',message:'Message',prompt:'Prompt',model:'Model',image_url:'Image URL',image:'Image URL',url:'URL',query:'Search Query'}[n]||n);
const toParam=(name,s={})=>({name,label:label(name),required:Boolean(s.required),in:'query',type:s.type==='integer'||s.type==='number'?'number':s.type==='boolean'?'boolean':'string',...(s.enum?{enum:s.enum}:{}),...(s.default!==undefined?{default:s.default}:{}),...(s.description?{description:s.description}:{}),...(s.example!==undefined?{example:s.example}:{}),...(s.format?{format:s.format}:{})});
async function liveCatalog(){
  const r=await fetch('https://api.zyvor.my.id/openapi.json',{headers:{accept:'application/json'},signal:AbortSignal.timeout(7000)});
  if(!r.ok)throw new Error(`OpenAPI HTTP ${r.status}`);
  const doc=await r.json(); const endpoints=Array.isArray(doc?.endpoints)?doc.endpoints:[]; const seen=new Set(); const tools=[];
  for(const e of endpoints){const route=String(e.route||'');const name=String(e.name||'').trim();const hay=[name,e.category,e.description,route].join(' ');if(!route||!name||blocked.test(hay))continue;const method=Array.isArray(e.methods)&&e.methods.includes('POST')?'POST':(e.methods?.[0]||'GET');const key=`${method}:${route}`;if(seen.has(key))continue;seen.add(key);const raw=e.paramsSchema&&typeof e.paramsSchema==='object'?e.paramsSchema:{};if(Object.keys(raw).some(n=>credentialParam.test(n)))continue;const hiddenParams=Object.entries(raw).filter(([n])=>internal.test(n)).map(([n,s])=>toParam(n,s));const params=Object.entries(raw).filter(([n])=>!internal.test(n)).map(([n,s])=>toParam(n,s));tools.push({id:`zyvor-${slug(route.replace(/^\/api\//,''))}-${slug(method)}`,name,description:String(e.description||'Zyvor API tool.'),category:category(e.category),endpoint:route,method,params,hiddenParams,required:params.filter(p=>p.required).map(p=>p.name),responseType:'json',free:true,ui:'generic',source:'zyvor-openapi',openapiVersion:doc.version||null,status:e.status||'online'});}
  return tools;
}
export default async function handler(req,res){
  res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
  try{const live=await liveCatalog();if(live.length)return res.end(JSON.stringify({ok:true,source:'live-zyvor-openapi',upstream:'https://api.zyvor.my.id',count:live.length,tools:live}));}catch{}
  res.end(JSON.stringify({ok:true,source:'KING-VANDYZ curated Zyvor migration catalog',upstream:process.env.API_BASE_URL||'https://api.zyvor.my.id',count:KNOWN_TOOLS.length,tools:KNOWN_TOOLS}));
}
