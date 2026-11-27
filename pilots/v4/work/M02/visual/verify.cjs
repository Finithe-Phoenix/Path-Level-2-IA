'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {frame,castingFrame}=require('./scene.cjs');
const data=require('./evidence/takes.json');
const lesson=require('../lesson.json');
const root=__dirname;
const args=process.argv.slice(2);
const get=key=>args.includes(key)?args[args.indexOf(key)+1]:undefined;
const out=get('--frames');
if(out)fs.mkdirSync(out,{recursive:true});
const timing=get('--timing')?JSON.parse(fs.readFileSync(get('--timing'),'utf8')):null;
let samples=0;
for(const [key,take] of Object.entries(data.takes)){
  const saved=fs.readFileSync(path.join(root,'evidence',key+'.txt'),'utf8').trimEnd();
  assert.deepEqual(saved.split('\n'),take.lines,key);
  const cast=fs.readFileSync(path.join(root,'evidence',key+'.cast'),'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(cast[0].version,2);
  const output=cast.slice(1).map(v=>v[2]).join('').replaceAll('\r','');
  assert(output.includes(take.command+'\n'),key+' command');
  assert(output.includes(saved),key+' stdout');
}
assert.equal(data.takes.red.tests.at(-1).status,'FAIL');
assert.equal(data.takes.green.tests.at(-1).status,'ok');
assert.equal(data.takes['upper-red'].tests[0].status,'FAIL');
assert.equal(data.takes['upper-green'].tests[0].status,'ok');
const hashes=new Set();
for(const [index,src] of lesson.scenes.entries()){
  const scene=timing?timing.scenes.find(s=>s.id===src.id):{...src,durationFrames:src.beats.length*240,beats:src.beats.map((b,i)=>({...b,start:i*10,end:(i+1)*10}))};
  assert(scene && scene.beats.length===src.beats.length,src.id);
  // A narration can have lead room before its first spoken beat.
  // The first frame must still establish that scene, including the unopened transfer exercise.
  const first=frame({scene,index,episode:lesson,seconds:0,progress:0});
  const firstOnly={...scene,beats:[{...scene.beats[0],start:0}]};
  assert.equal(first,frame({scene:firstOnly,index,episode:lesson,seconds:0,progress:0}),scene.id+' preroll selected a later shot');
  if(scene.id==='transfer')assert(first.includes('The upper end is inclusive.') && !first.includes('VERIFIED EXERCISE EXPRESSION'));
  if(scene.id==='baseline')assert(first.includes('DEBUGGING AT THE BOUNDARY') && !first.includes('Which input is missing?'));
  for(const beat of scene.beats){
    if(beat.id==='challenge' && Number.isFinite(beat.speechEnd)){
      assert(beat.end-beat.speechEnd>=4.99,'Expected a five-second answer hold');
      for(const time of [beat.speechEnd,(beat.speechEnd+beat.end)/2,beat.end-.02]){
        const waiting=frame({scene,index,episode:lesson,seconds:time,progress:time/(scene.durationFrames/24)});
        assert.equal((waiting.match(/>\?<\/text>/g)||[]).length,3,'Practice solution appeared during the silent hold');
      }
    }
    for(const u of [.02,.21,.45,.66,.84,.96]){
      const seconds=beat.start+(beat.end-beat.start)*u;
      const svg=frame({scene,index,episode:lesson,seconds,progress:seconds/(scene.durationFrames/24)});
      assert(svg.startsWith('<svg') && svg.endsWith('</svg>') && svg.includes('viewBox="0 0 1920 1080"'),scene.id);
      assert(!/(?:NaN|undefined|Infinity)/.test(svg.replace(/data:image\/[^"]+/g,'')),scene.id+'/'+beat.id);
      if(beat.id==='challenge') {
        assert(!svg.includes('draft  True') && !svg.includes('FAILED (failures=1)'), 'The answer leaked before the practice hold');
        assert.equal((svg.match(/>\?<\/text>/g)||[]).length,3);
      }
      if(out)fs.writeFileSync(path.join(out,scene.id+'_'+beat.id+'_'+u+'.svg'),svg);
      hashes.add(crypto.createHash('sha256').update(svg).digest('hex'));samples++;
    }
  }
}
assert.equal(castingFrame(),castingFrame());
assert(hashes.size>70,'Expected multiple real views per part');
console.log(JSON.stringify({recordedTakes:Object.keys(data.takes).length,scenes:lesson.scenes.length,beatSamples:samples,distinctVisuals:hashes.size,hasAlignedNarration:!!timing}));
