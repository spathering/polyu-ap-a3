// Prepare previously extracted, local research frames. Never download or publish them.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.resolve(process.argv[2]||path.join(root,'../.midwork/assignment3/reference-assets/vector-character-animation/frames'));
const catalog=JSON.parse(await fs.readFile(path.join(root,'assets/character/animations.json'),'utf8'));
let count=0;
for(const clip of catalog.clips.filter(c=>c.origin==='local-reference')){
 for(const sheet of clip.sheets){
  const from=path.join(source,clip.sourceDirectory,path.basename(sheet.file));
  const bytes=await fs.readFile(from);
  if(createHash('sha256').update(bytes).digest('hex')!==sheet.sha256)throw Error(`Source hash differs: ${from}`);
  const destination=path.resolve(root,sheet.file);
  if(!destination.startsWith(path.join(root,'assets/local-reference')+path.sep))throw Error('Invalid local asset destination');
  await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,bytes);count++;
 }
}
console.log(`Prepared ${count} reference sprite pages in ignored assets/local-reference/. Local research only.`);
