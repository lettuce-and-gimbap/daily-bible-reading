// Existing summary labels are not a complete or disambiguated list of Bible people.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {APPEARANCES,appearanceFor} from '../../js/features/pixel-bible/appearance.js';
const root=fileURLToPath(new URL('../../',import.meta.url));
const labels=new Map();let chapters=0;const files=fs.readdirSync(path.join(root,'data/summary')).filter(f=>f.endsWith('.json')).sort();
for(const file of files){const book=JSON.parse(fs.readFileSync(path.join(root,'data/summary',file)));for(const [chapter,data] of Object.entries(book.chapters)){chapters++;for(const p of data.people||[]){if(!labels.has(p.name))labels.set(p.name,{name:p.name,roles:new Set(),refs:new Set()});const item=labels.get(p.name);if(p.role)item.roles.add(p.role);item.refs.add(`${book.book}.${chapter}`);}}}
const entries=[...labels.values()].sort((a,b)=>a.name.localeCompare(b.name,'ko')).map(p=>{const a=appearanceFor(p.name);return {name:p.name,roles:[...p.roles].sort(),refs:[...p.refs],appearance:a.key,review:a.key==='generic'?'unreviewed-label':'profile-symbolic'};});
const stats={books:files.length,chapters,sourceLabels:entries.length,dedicatedProfiles:Object.keys(APPEARANCES).length,labelsWithProfile:entries.filter(e=>e.appearance!=='generic').length};
const catalog={schema:1,scope:'Index of existing summary people labels, including groups and ambiguous names. Not a complete biblical person census. Appearance is symbolic and may use another point in the narrative.',stats,entries};
const output=path.join(root,'data/pixel-bible/people-catalog.json');
if(process.argv.includes('--check')){if(fs.readFileSync(output,'utf8')!==JSON.stringify(catalog,null,2)+'\n')throw Error('Catalog is stale; run node tools/pixel-bible/catalog.mjs');}else fs.writeFileSync(output,JSON.stringify(catalog,null,2)+'\n');
console.log(JSON.stringify(stats));
