// Verify bundled reference-derived runtime atlases; optionally restore from an archive.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.resolve(process.argv[2]||path.join(root,'../.midwork/assignment3/reference-assets/vector-character-animation/frames'));
const catalog=JSON.parse(await fs.readFile(path.join(root,'assets/character/animations.json'),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');let verified=0,restored=0;
for(const clip of catalog.clips.filter(c=>c.origin==='local-reference')){
 for(const sheet of clip.sheets){
  const destination=path.resolve(root,sheet.file);
  if(!destination.startsWith(path.join(root,'assets/character/reference')+path.sep))throw Error('Invalid reference atlas destination');
  if(!process.argv[2]){try{const existing=await fs.readFile(destination);if(hash(existing)===sheet.sha256){verified++;continue;}}catch{/* Restore a missing atlas from the optional local archive. */}}
  const from=path.join(source,clip.sourceDirectory,path.basename(sheet.file)),bytes=await fs.readFile(from);
  if(hash(bytes)!==sheet.sha256)throw Error(`Source hash differs: ${from}`);
  await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,bytes);restored++;
 }
}
console.log(`Verified ${verified} bundled reference atlases; restored ${restored}. No network access or raw source copying.`);
