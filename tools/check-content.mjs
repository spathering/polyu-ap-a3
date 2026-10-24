import fs from 'node:fs/promises';
import {validateContent} from '../src/content.js';
const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const [content,schema,lab]=await Promise.all([read('../content/parkour.json'),read('../Documents/Plans/Design/Schemas/content-package.schema.json'),read('../content/lab-course.json')]);
const errors=validateContent(content,schema,lab);if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Content valid: ${content.modules.length} prefabs, ${content.modules.reduce((n,m)=>n+m.entities.length,0)} entities, ${lab.stations.length} stations, ${lab.coverage.length} coverage checks.`);
