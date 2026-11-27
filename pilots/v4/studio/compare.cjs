'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFile}=require('node:child_process');
const run=require('node:util').promisify(execFile);
const {encode,probe}=require('./render.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ff=args=>run('ffmpeg',['-nostdin','-v','error','-y',...args],{maxBuffer:8*1024*1024});
const startFrame=2341,total=1080,fps=24;
function stamp(ms){
  return new Date(ms).toISOString().slice(11,23).replace('.',',');
}
function ms(t){return t.split(/[:,]/).reduce((a,v,i)=>i===3?a*1000+Number(v):a*60+Number(v),0);}
function clipSrt(text){
  const blocks=[];
  const start=Math.round(startFrame*1000/fps), end=start+45000;
  for(const block of text.trim().split(/\r?\n\s*\r?\n/)){
    const [,times,...body]=block.split(/\r?\n/),[a,b]=times.split(' --> ').map(ms);
    if(b<=start||a>=end)continue;
    blocks.push((blocks.length+1)+'\n'+stamp(Math.max(start,a)-start)+' --> '+stamp(Math.min(end,b)-start)+'\n'+body.join('\n'));
  }
  if(!blocks.length)throw Error('Empty comparison captions');
  return blocks.join('\n\n')+'\n';
}
async function main(){
  const root=path.resolve(process.argv[2]||'.'),base=path.resolve(process.argv[3]||'../..');
  const dest=path.resolve(process.argv[4]||path.join(root,'build','comparison'));
  fs.mkdirSync(dest,{recursive:true});
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'m02-matched-'));
  try{
    const lesson=read(path.join(root,'work/M02/lesson.json'));
    let cursor=0;
    const parts=[
      ['red',587,[['run',0],['reason',6.826],['setup',12.709]]],
      ['patch',186,[['edit',0]]],
      ['green',307,[['replay',0],['handoff',3.155]]]
    ];
    const scenes=parts.map(([id,frames,anchors])=>{
      const source=lesson.scenes.find(s=>s.id===id);
      const beats=anchors.map(([key,start],i)=>({...source.beats.find(b=>b.id===key),id:key,start,end:anchors[i+1]?.[1]??frames/24}));
      const s={...source,beats,beatTimings:beats,startFrame:cursor,durationFrames:frames,duration:frames/24};
      cursor+=frames;return s;
    });
    const episode={...lesson,scenes,fps:24,durationFrames:total};
    const visual=require(path.join(root,'work/M02/visual/scene.cjs'));
    const audio=path.join(tmp,'speech.m4a'),srt=path.join(dest,'matched.en.srt');
    await ff(['-i',path.join(base,'narration/M02/narration.m4a'),'-af','atrim=start_sample='+(startFrame*2000)+':end_sample='+((startFrame+total)*2000)+',asetpts=PTS-STARTPTS','-ar','48000','-ac','1','-c:a','aac','-b:a','144k',audio]);
    fs.writeFileSync(srt,clipSrt(fs.readFileSync(path.join(base,'subtitles/M02.en.srt'),'utf8')));
    const old=path.join(tmp,'original.mp4'),fresh=path.join(tmp,'directed.mp4');
    await ff(['-i',path.join(base,'videos/M02.mp4'),'-map','0:v:0','-an','-sn','-dn','-map_chapters','-1','-map_metadata','-1',
      '-vf','fps=24,trim=start_frame='+startFrame+':end_frame='+(startFrame+total)+',setpts=PTS-STARTPTS,scale=1920:1080:flags=lanczos,format=yuv420p',
      '-threads','2','-preset','veryfast','-crf','19','-c:v','libx264','-video_track_timescale','24000','-movflags','+faststart',old]);
    await encode({episode,visual,output:fresh,pictureOnly:true,jobs:2});
    for(const [name,picture] of [['original',old],['directed',fresh]]) {
      const out=path.join(dest,name+'.mp4');
      await ff(['-i',picture,'-i',audio,'-i',srt,'-map','0:v:0','-map','1:a:0','-map','2:s:0','-map_chapters','-1','-map_metadata','-1',
          '-c','copy','-c:s','mov_text','-metadata:s:a:0','language=eng','-metadata:s:s:0','language=eng','-metadata','title=Boundary test','-movflags','+faststart',out]);
      const meta=await probe(out);
      if(Number(meta.streams[0].nb_frames)!==1080 || Number(meta.format.duration)>45.04)throw Error('Invalid matched export');
    }
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
