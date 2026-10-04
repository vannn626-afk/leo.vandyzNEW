import fs from 'node:fs/promises';

const OPENAPI_URL = 'https://api.zyvor.my.id/openapi.json';
const OUT = new URL('../src/data/zyvor.generated.js', import.meta.url);
const FALLBACK = `// Generated Zyvor catalog. Build-time sync failed; existing KING VANDYZ catalog remains active.\nexport const ZYYVOR_GENERATED_TOOLS = [];\n`;

const normalizeCategory = (raw='') => {
  const s = String(raw).toLowerCase();
  if (s.includes('ai')) return 'ai';
  if (s.includes('image') || s.includes('gambar')) return 'image';
  if (s.includes('video') || s.includes('hd')) return 'hd-video';
  if (s.includes('download')) return 'download';
  if (s.includes('maker')) return 'maker';
  if (s.includes('anime')) return 'anime';
  if (s.includes('search')) return 'search';
  if (s.includes('developer') || s.includes('tools')) return 'developer';
  if (s.includes('fun')) return 'fun';
  if (s.includes('whatsapp')) return 'whatsapp';
  return s.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'other';
};

const slug = s => String(s||'tool').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);
const blocked = /primbon|jud[i1]ol|judi|casino|slot|betting|sports[- ]?bet|gambling|weapon|firearm|gun|narkoba|drug|cocaine|marijuana|thc|porn|nsfw|adult[- ]?sex|escort/i;
const credentialParam = /^(cookie|orgId|authorization|token|api[_-]?key|apikey|secret)$/i;
const internal = /^(session|session_id|conversation_id)$/i;
const userLabel = name => ({
  text:'Text / Prompt', teks:'Text / Prompt', message:'Message', prompt:'Prompt',
  model:'Model', image_url:'Image URL', image:'Image URL', url:'URL', query:'Search Query'
}[name] || name);

function toParam(name, schema={}) {
  const type = schema.type === 'integer' || schema.type === 'number' ? 'number' : schema.type === 'boolean' ? 'boolean' : 'string';
  const p = { name, label:userLabel(name), required:Boolean(schema.required), in:'query', type };
  if (schema.enum) p.enum = schema.enum;
  if (schema.default !== undefined) p.default = schema.default;
  if (schema.description) p.description = schema.description;
  if (schema.example !== undefined) p.example = schema.example;
  if (schema.minLength !== undefined) p.minLength = schema.minLength;
  if (schema.maxLength !== undefined) p.maxLength = schema.maxLength;
  if (schema.format) p.format = schema.format;
  return p;
}

async function main(){
  try {
    const r = await fetch(OPENAPI_URL, { headers:{accept:'application/json'}, signal:AbortSignal.timeout(25000) });
    if(!r.ok) throw new Error(`OpenAPI HTTP ${r.status}`);
    const doc = await r.json();
    const endpoints = Array.isArray(doc?.endpoints) ? doc.endpoints : [];
    const seen = new Set();
    const tools = [];
    for(const e of endpoints){
      const route = String(e.route||'');
      const name = String(e.name||'').trim();
      const hay = [name,e.category,e.description,route].join(' ');
      if(!route || !name || blocked.test(hay)) continue;
      const method = Array.isArray(e.methods) && e.methods.includes('POST') ? 'POST' : (e.methods?.[0] || 'GET');
      const key = `${method}:${route}`;
      if(seen.has(key)) continue;
      seen.add(key);
      const raw = e.paramsSchema && typeof e.paramsSchema === 'object' ? e.paramsSchema : {};
      // Do not expose endpoints that require users to paste personal credentials/cookies.
      if(Object.keys(raw).some(n=>credentialParam.test(n))) continue;
      const hiddenParams = Object.entries(raw).filter(([n])=>internal.test(n)).map(([n,s])=>toParam(n,s));
      const params = Object.entries(raw)
        .filter(([n]) => !internal.test(n))
        .map(([n,s])=>toParam(n,s));
      const required = params.filter(p=>p.required).map(p=>p.name);
      const id = `zyvor-${slug(route.replace(/^\/api\//,''))}-${slug(method)}`;
      tools.push({
        id, name, description:String(e.description||'Zyvor API tool.'), category:normalizeCategory(e.category),
        endpoint:route, method, params, hiddenParams, required, responseType:'json', free:true, ui:'generic',
        source:'zyvor-openapi', openapiVersion:doc.version||null, status:e.status||'online'
      });
    }
    const js = `// AUTO-GENERATED at build time from ${OPENAPI_URL}\n// Do not edit manually. Existing KING VANDYZ catalog is merged with this list.\nexport const ZYYVOR_GENERATED_TOOLS = ${JSON.stringify(tools,null,2)};\n`;
    await fs.writeFile(OUT,js);
    console.log(`Zyvor OpenAPI sync: ${tools.length} safe endpoints generated.`);
  } catch(err){
    console.warn(`Zyvor OpenAPI sync skipped: ${err?.message||err}`);
    await fs.writeFile(OUT,FALLBACK);
  }
}
main();
