import fs from 'node:fs/promises';
import {validatePerformanceSequences} from '../src/scene-performance.js';
import {validateContent} from '../src/content.js';
import {validateFlow,createChallenge} from '../src/game-flow.js';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const [content,schema,lab]=await Promise.all([read('../content/parkour.json'),read('../Documents/Plans/Design/Schemas/content-package.schema.json'),read('../content/lab-course.json')]);
const catalogue=await read('../'+lab.art.manifest),flow=await read('../content/game-flow.json'),errors=[...validatePerformanceSequences(content,catalogue),...validateContent(content,schema,lab),...validateFlow(flow,lab,content)];if(!errors.length)for(const level of flow.levels){try{createChallenge(content,schema,lab,flow,level.id);}catch(e){errors.push(e.message);}}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Content valid: ${content.modules.length} modules, ${content.modules.filter(m=>m.tags.includes('prefab')).length} library prefabs, ${content.modules.reduce((n,m)=>n+m.entities.length,0)} entities, ${lab.stations.length} stations, ${lab.coverage.length} lab checks, ${flow.levels.length} finite challenges.`);
