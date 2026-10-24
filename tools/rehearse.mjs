import fs from 'node:fs/promises';
import {runRehearsal} from '../src/rehearsal.js';
const read=async n=>JSON.parse(await fs.readFile(new URL(n,import.meta.url),'utf8'));
const [content,lab]=await Promise.all([read('../content/parkour.json'),read('../content/lab-course.json')]);
const covered=new Set(),results=lab.witnesses.map(w=>{const result=runRehearsal(content,lab,w);for(const id of Object.keys(result.coverage))covered.add(id);const {sim,...record}=result;return record;});
const missing=lab.coverage.filter(c=>!covered.has(c.id)).map(c=>c.id),passed=results.every(r=>!r.missing.length)&&!missing.length;
console.log(JSON.stringify({passed,rehearsals:results.length,covered:covered.size,required:lab.coverage.length,missing,results},null,2));if(!passed)process.exitCode=1;
