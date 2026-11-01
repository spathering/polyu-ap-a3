// Check the release catalogue and its openly licensed, bundled PNGs.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),catalog=JSON.parse(await fs.readFile(new URL('assets/character/animations.json',root),'utf8'));
const sheets=new Map();
for(const clip of catalog.clips){
 const source=catalog.sources.find(s=>s.id===clip.source);
 if(clip.origin!=='cc0'||clip.license!=='CC0-1.0'||source?.license!==clip.license)throw Error(`Unverified release provenance: ${clip.id}`);
 for(const sheet of clip.sheets){
  if(!sheet.file.startsWith('assets/character/cc0-agent/')||sheet.file.includes('..'))throw Error('Invalid release atlas path');
  if(sheets.has(sheet.file)&&sheets.get(sheet.file)!==sheet.sha256)throw Error(`Conflicting hash: ${sheet.file}`);
  sheets.set(sheet.file,sheet.sha256);
 }
}
for(const [file,hash] of sheets){const bytes=await fs.readFile(new URL(file,root));if(createHash('sha256').update(bytes).digest('hex')!==hash)throw Error(`Atlas hash differs: ${file}`);}
console.log(`Verified ${sheets.size} CC0 source strips and ${Object.keys(catalog.sequences).length} animation sequences. No private research files are required.`);
