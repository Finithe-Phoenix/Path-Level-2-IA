const fs=require('node:fs'),path=require('node:path'),{execFile}=require('node:child_process');
const {encode}=require('./render.cjs');
async function main(){
  const root=path.resolve(process.argv[2]||'.');const cast=path.join(root,'work/casting');
  const output=path.join(root,'review');fs.mkdirSync(output,{recursive:true});
  const t=JSON.parse(fs.readFileSync(path.join(cast,'timeline.json')));
  const episode={id:'CAST',title:'Order quantity',durationFrames:t.durationFrames,fps:24,
    scenes:t.beats.map(b=>({id:b.id,title:b.id,startFrame:b.startFrame,durationFrames:b.endFrame-b.startFrame}))};
  const picture=path.join(root,'build','casting-picture.mp4');const vis=require(path.join(cast,'picture.cjs'));
  if(process.argv[3]!=='--mux-only')await encode({episode,visual:vis,output:picture,pictureOnly:true,jobs:2});
  // One encoded picture is reused in all cuts. Anonymous files have the same title.
  for(const label of ['A','B','C']){
    const file=path.join(cast,label+'.m4a'),srt=path.join(cast,label+'.srt');
    await require('node:util').promisify(execFile)('ffmpeg',['-nostdin','-v','error','-y','-i',picture,'-i',file,'-i',srt,'-map','0:v:0','-map','1:a:0','-map','2:s:0',
      '-map_metadata','-1','-c','copy','-c:s','mov_text','-metadata:s:a:0','language=eng','-metadata:s:s:0','language=eng','-metadata','title=Order quantity','-movflags','+faststart',path.join(output,'voz-'+label+'.mp4')]);
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
