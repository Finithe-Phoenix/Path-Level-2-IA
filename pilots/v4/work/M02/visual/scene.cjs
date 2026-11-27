'use strict';
const fs = require('node:fs');
const path = require('node:path');
const evidence = require('./evidence/takes.json');
const originalKeys = fs.readFileSync(path.join(__dirname,'evidence/baseline.cast'),'utf8').trim().split('\n').slice(1).map(v=>JSON.parse(v));
const commandEvents = [];
for (const row of originalKeys.slice(1)) {
  if (row[2].includes('\n')) break;
  commandEvents.push(row);
}
const plate = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname,'art/zero-instrument.jpg'),'base64');
const raw = {
  baseline:'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'evidence/native-baseline.png'),'base64'),
  red:'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'evidence/native-red.png'),'base64'),
  green:'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'evidence/native-green.png'),'base64'),
  before:'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'editor/before.png'),'base64'),
  after:'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'editor/after.png'),'base64')
};

const C={dark:'#10171a',black:'#0b1114',ink:'#172126',muted:'#a8bbb8',bright:'#f6f4e9',paper:'#eeeade',soft:'#c7c2b0',rust:'#b93c29',orange:'#ff8763',teal:'#87e5c1',deep:'#1a7461',gold:'#e7bb73'};
const S='Open Sans,DejaVu Sans,sans-serif', M='DejaVu Sans Mono,monospace';
const STAGES=['baseline','probe','prediction','regression','red','patch','green','transfer'];
const DEFAULTS={baseline:['run','method','coverage'],probe:['probe','expected','gap'],prediction:['plan','substitute','neighbors'],regression:['scope','assert','inspect'],red:['run','reason','setup'],patch:['edit','predict'],green:['replay','handoff'],transfer:['rule','challenge','reveal','why']};
const LEGACY={'symptom':'probe','hypothesis':'prediction','red-test':'regression','read-red':'red','fix-green':'patch','practice':'green'};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const reveal=(t,a,b)=>ease((t-a)/(b-a));
const mix=(a,b,t)=>a+(b-a)*t;
const num=x=>Math.round(x*100)/100;
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const txt=(x,y,value,size,color=C.bright,opt={})=>`<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${color}" font-family="${opt.mono?M:S}" font-weight="${opt.bold?700:opt.weight||400}" text-anchor="${opt.end?'end':opt.center?'middle':'start'}"${opt.spacing?' letter-spacing="'+opt.spacing+'"':''} xml:space="preserve">${esc(value)}</text>`;
const rect=(x,y,w,h,color,more='')=>`<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" fill="${color}" ${more}/>`;
const line=(x,y,xx,yy,color,weight=2,more='')=>`<path d="M${num(x)},${num(y)} L${num(xx)},${num(yy)}" fill="none" stroke="${color}" stroke-width="${num(weight)}" ${more}/>`;
const dot=(x,y,r,color,more='')=>`<circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}" fill="${color}" ${more}/>`;
const label=(x,y,s,light=false)=>txt(x,y,s,24,light?'#49605d':C.muted,{bold:true,spacing:2});
const g=(body,atts)=>`<g ${atts}>${body}</g>`;
const op=(body,opacity)=>opacity<=0?'':opacity>=1?body:g(body,`opacity="${num(opacity)}"`);
const slide=(body,x=0,y=0)=>g(body,`transform="translate(${num(x)} ${num(y)})"`);
const img=(href,x,y,w,h)=>`<image x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" preserveAspectRatio="none" xlink:href="${href}"/>`;
const clip=(id,x,y,w,h,body)=>`<defs><clipPath id="${id}"><rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}"/></clipPath></defs><g clip-path="url(#${id})">${body}</g>`;
const secFmt=x=>String(x).padStart(2,'0');
const idLabel=(i)=>secFmt(i+1)+' / 08';
const full=(x)=>`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1920 1080" width="1920" height="1080">${x}</svg>`;
const baseDefs='<defs><linearGradient id="shade"><stop stop-color="#061014" stop-opacity=".91"/><stop offset=".53" stop-color="#0b1014" stop-opacity=".22"/><stop offset="1" stop-color="#0b1014" stop-opacity="0"/></linearGradient><linearGradient id="floor" x2="0" y2="1"><stop stop-color="#202c30"/><stop offset="1" stop-color="#0b1419"/></linearGradient><linearGradient id="metal"><stop stop-color="#e1bb7d"/><stop offset=".48" stop-color="#776242"/><stop offset="1" stop-color="#d1ae79"/></linearGradient></defs>';
function info(key){return evidence.takes[key];}
function upper(id){return id.toUpperCase();}
function smallTitle(kicker,title,ink=false){
  return label(98,119,kicker,ink)+txt(94,222,title,77,ink?C.ink:C.bright,{bold:true});
}
function controls(index,progress,light=false,kind='ORDER QUANTITY LAB'){
  const col=light?'#425653':C.muted, stroke=light?'#a39f90':'#405055';
  let s=line(96,59,1824,59,stroke,1)+txt(98,42,kind,20,col,{bold:true,spacing:2})+
    txt(1822,42,'M02  /  '+idLabel(index),20,col,{end:true,mono:true});
  // Reserve the lower fifth for the player's selectable captions.
  s+=line(96,878,1824,878,stroke,1);
  for(let i=0;i<8;i++){const a=97+i*27;s+=line(a,898,a+17,898,i<=index?(light?C.deep:C.teal):stroke,i===index?5:3);}

  return s;
}
function background(light=false){return rect(0,0,1920,1080,light?C.paper:'url(#floor)');}
function cropPhoto(id,src,w,h,box,from,to,p){
  const fx=mix(from[0],to[0],ease(p)),fy=mix(from[1],to[1],ease(p)),z=mix(from[2],to[2],ease(p));
  return clip(id,...box,img(src,box[0]-fx*z,box[1]-fy*z,w*z,h*z));
}
function optical(t,progress){
  const z=1+.035*ease(t/4),px=1120,py=500;
  let s=img(plate,px*(1-z),py*(1-z),1920*z,1080*z)+rect(0,0,1920,1080,'url(#shade)');
  s+=label(100,143,'M02   /   DEBUGGING AT THE BOUNDARY');
  const a=reveal(t,0,.8);s+=op(slide(txt(90,378,'A zero slipped',112,C.bright,{bold:true})+txt(90,548,'through.',133,C.bright,{bold:true}),0,24*(1-a)),a);
  s+=op(line(99,619,410,619,C.orange,4)+txt(101,707,'The minimum order is one.',40,'#e7e6d8'),reveal(t,.65,1.45));
  s+=controls(0,progress);return s;
}
// Repeated mechanical rail is a spatial rule: distances represent equal numeric steps.
function rail({x=205,y=665,w=1510,from=-2,to=2,active=0,light=false,mode='neutral',p=1}) {
  const fg=light?C.ink:C.bright,sub=light?'#737f76':'#869e98';
  const base=light?'#9b9786':'#455854',cx=n=>x+(n-from)/(to-from)*w;
  let s=line(x,y,x+w,y,base,4);
  const count=(to-from)*8;
  for(let i=0;i<=count;i++){const xx=x+w*i/count,major=i%8===0;
    s+=line(xx,y-4,xx,y+(major?28:i%4===0?17:8),major?sub:base,major?3:1.3);
    if(major)s+=txt(xx,y+72,from+i/8,32,fg,{center:true,mono:true});
  }
  const position=cx(active),color=mode==='red'?(light?C.rust:C.orange):mode==='green'?(light?C.deep:C.teal):light?C.ink:C.gold;
  s+=line(position,y-91,position,y-12,color,3)+dot(position,y,13,color)+dot(position,y,22,'none',`stroke="${color}" stroke-width="2" opacity="${num(.85-.55*ease(p))}"`);
  return s;
}
function terminalShot(name,phase,p,progress,idx){
  const red=name==='red',col=red?C.orange:C.teal;
  const result=red?'AssertionError: True is not false':name==='baseline'?'Ran 3 tests':'Ran 4 tests';
  const binary=info(name).lines.at(-1),ww=1920,wh=660,top=172;
  // Camera coordinates refer to physical pixels in the captured X11 window.
  // A red run follows the actual row from the method list into the traceback.
  let z=1.67+.31*ease(p),cx=0,cy=0,target=red?122:name==='baseline'?166:189;
  if(red){
    z=1.62+1.33*reveal(p,.12,.76);
    cy=mix(0,178,reveal(p,.19,.77));
    target=mix(119,295,reveal(p,.24,.79));
  }else{
    z=1.62+.64*reveal(p,.21,.79);
    cy=mix(0,name==='baseline'?43:65,reveal(p,.2,.88));
  }
  let s=rect(0,0,1920,1080,'#10161c');
  s+=img(raw[name],60-cx*z,top-cy*z,1142*z,684*z);
  // The film aperture crops the real screen. Hold off surrounding chrome while the learner inspects the transcript.
  s+=rect(0,0,1920,top,'#10161c')+rect(0,top+wh,1920,1080-top-wh,'#10161c');
  s+=label(64,69,'M02   /   REAL TERMINAL')+txt(1851,68,'XFCE     •     PYTHON UNITTEST',23,C.muted,{mono:true,end:true});
  s+=line(63,101,1854,101,'#354443',2)+dot(68,135,7,col)+txt(91,145,name==='baseline'?'BASELINE':red?'TEST-ONLY CHANGE':'FIXED CHECKOUT',24,col,{mono:true,bold:true});
  const yy=top+(target-cy)*z,flash=reveal(p,.2,.45);
  s+=op(line(28,yy-13,28,yy+20,col,6)+line(26,yy-13,49,yy-13,col,4),flash);
  s+=line(62,836,1856,836,'#405251',2)+label(64,887,red?'FAILURE TRACE':'SUITE SUMMARY')+
     txt(1817,890,red?result:result+'  /  '+binary,34,col,{end:true,mono:true,bold:true});
  return s;
}
function commandLine(t){
  const value=info('baseline').command,elapsed=t*.42;
  const prefix=commandEvents.filter(row=>row[0]<=elapsed).map(row=>row[2]).join('');
  const upto=prefix.length,size=49;
  let s=smallTitle('SHELL REPLAY   /   TRAINING CHECKOUT','Run the starting suite.');
  s+=label(108,367,'RECORDED COMMAND')+txt(104,480,'$',76,C.teal,{mono:true})+txt(185,474,prefix,size,C.bright,{mono:true});
  if(upto<value.length)s+=rect(188+upto*size*.602,432,4,55,C.teal);
  s+=line(108,565,1798,565,'#596b6a',1)+txt(108,662,'discover',37,C.gold,{mono:true})+txt(105,723,'find the tests',32,C.muted)+
     txt(665,662,'-s tests',37,C.gold,{mono:true})+txt(663,723,'search this directory',32,C.muted)+
     txt(1242,662,'-v',37,C.gold,{mono:true})+txt(1240,723,'show each result',32,C.muted);
  return s;
}
function runnerNames(name,t,p){
  const rows=info(name).tests,red=name==='red',color=red?C.orange:C.teal;
  let s=smallTitle('RUNNER OUTPUT   /   METHOD NAMES',name==='baseline'?'Which input is missing?':'The same four methods.');
  const count=Math.min(rows.length,Math.max(1,Math.ceil((t+.15)/.52)));
  for(let i=0;i<count;i++){const a=reveal(t+.3,i*.52,i*.52+.54),y=355+i*91;
    const row=rows[i],accent=row.status==='FAIL'?C.orange:C.teal;
    s+=op(slide(txt(105,y,row.name,53,C.bright,{mono:true})+txt(1660,y,row.status,54,accent,{end:true,mono:true,bold:true})+line(107,y+25,1660,y+25,'#394a4c',1),0,14*(1-a)),a);
  }
  const total=info(name).lines.find(v=>v.startsWith('Ran '));
  s+=op(txt(107,784,total,42,color,{mono:true}),reveal(t,1.25,2.02));
  return s;
}
function probeShot(b,q,progress,i){
  let s;
  if(b==='probe'){
    s=background()+smallTitle('CAPTURED PYTHON PROBE   /   ISOLATED INPUT','Call the public function.');
    s+=label(111,359,'FUNCTION CALL')+txt(106,475,'is_valid_quantity(',68,C.bright,{mono:true})+
      txt(846,475,'0',68,C.gold,{mono:true})+txt(889,475,')',68,C.bright,{mono:true});
    const a=reveal(q,.25,.63);s+=line(109,558,1165,558,'#51615a',2)+op(txt(112,666,'stdout',30,C.muted,{mono:true})+txt(114,789,info('probe').lines[0],100,C.orange,{mono:true,bold:true}),a);
  }else if(b==='expected'){
    s=background(true)+smallTitle('ISSUE.MD   /   COMPARE WITH THE REQUIREMENT','The return value disagrees.',true);
    s+=label(110,378,'OBSERVED  /  PYTHON',true)+txt(99,533,'True',125,C.rust,{mono:true,bold:true})+
       line(822,359,822,570,'#b7b4a7',2)+label(895,378,'EXPECTED  /  TICKET',true)+txt(878,533,'False',125,C.deep,{mono:true,bold:true});
    s+=rail({light:true,active:0,p:q,y:679,mode:'red'});
  }else{
    s=background()+smallTitle('ORDER_QUANTITY.PY   /   BEFORE ANY EDIT','Keep the original line.');
    s+=sourceView('before',q,'probe');
  }
  return s+controls(i,progress,b==='expected');
}
function sourceView(name,p,id){
  // The Code OSS screenshots are left in their original pixel coordinates.
  const shot=cropPhoto('editor-'+id,raw[name],1920,1080,[99,279,1720,518],[150,0,1.13],[404,75,1.78],clamp(p));
  return rect(98,277,1724,521,'#232323')+shot+label(99,844,'OPENVSCODE SERVER   /   REAL TRAINING CHECKOUT');
}
function promptCard(mode,lines,footer,p){
  const light=true;
  let s=background(light)+smallTitle('EDITABLE PROMPT   /   '+upper(mode)+' MODE','Give the agent a specific job.',true);
  s+=line(108,319,108,690,C.deep,7)+label(152,358,'EXAMPLE TO ENTER IN VS CODE',true);
  lines.forEach((v,i)=>{s+=op(txt(149,455+i*81,v,52,C.ink,{bold:true}),reveal(p+.2,i*.06,i*.06+.25));});
  s+=txt(148,773,footer,30,'#4a5c55',{mono:true});
  return s;
}
function predictionShot(b,q,progress,i){
  let s;
  if(b==='plan'){
    s=promptCard('Plan',['Which expression admits zero?','What would the new assertion do?'],'ISSUE.md   +   order_quantity.py   +   tests/test_order_quantity.py',q);
  }else if(b==='substitute'){
    const a=reveal(q,.13,.56),pulse=reveal(q,.42,.76);
    s=background()+smallTitle('ORDER_QUANTITY.PY   /   LINE 3','Substitute the input.');
    const x=107,y=518,sz=94,char=sz*.602,wordX=x+7*char;
    s+=label(110,344,'START WITH THE SOURCE EXPRESSION')+txt(x,y,'return ',sz,C.muted,{mono:true});
    s+=op(slide(txt(wordX,y,'quantity',sz,C.bright,{mono:true}),0,-55*a),1-a)+
       op(slide(txt(wordX,y,'0',sz,C.gold,{mono:true,bold:true}),0,60*(1-a)),a);
    const opX=wordX+mix(8,1,a)*char;
    s+=txt(opX,y,' >= 0',sz,C.bright,{mono:true})+
       line(wordX,574,wordX+mix(7,1,a)*char,574,C.gold,4);
    s+=op(txt(wordX,714,'True',82,C.orange,{mono:true,bold:true})+txt(wordX+340,703,'because zero equals zero',46,C.muted),pulse);
  }else{
    s=background()+smallTitle('ORIGINAL COMPARISON','Compare its neighbors.');
    const phase=q<.33?0:q<.67?1:2, cases=[[-1,'False'],[0,'True'],[1,'True']], [v,ans]=cases[phase];
    const stylus=-1+reveal(q,.27,.36)+reveal(q,.61,.70);
    s+=txt(110,482,v+' >= 0',79,C.bright,{mono:true})+txt(967,480,ans,91,phase===1?C.orange:C.teal,{mono:true,bold:true});
    s+=rail({active:stylus,p:q,mode:phase===1?'red':'green'});
  }
  return s+controls(i,progress,b==='plan');
}
function regressionShot(b,q,progress,i){
  if(b==='scope')return promptCard('Agent',['Add a regression for zero.','Keep the validator unchanged.'],'tests/test_order_quantity.py',q)+controls(i,progress,true);
  let s=background()+smallTitle('TESTS/TEST_ORDER_QUANTITY.PY   /   CAPTURED DIFF',b==='assert'?'Read the call from the inside out.':'Inspect the changed file.');
  if(b==='assert'){
    const rows=info('regression').lines.filter(z=>z.startsWith('+ ')&&z.includes('test_rejects_zero') || z.startsWith('+ ')&&z.includes('self.assertFalse'));
    s+=txt(105,403,rows[0]?.slice(1).trim()||'def test_rejects_zero(self):',52,C.muted,{mono:true});
    const text=(rows[1]||'').trim().slice(1).trim(), x=129,size=50,w=size*.602;
    s+=txt(x,514,text,size,C.bright,{mono:true});
    const stages=[['0','the input'],['is_valid_quantity(0)','the public call'],['assertFalse','the expectation']];
    const stage=Math.min(2,Math.floor(q*3));
    const [token,meaning]=stages[stage],pos=text.indexOf(token),xx=x+pos*w;
    s+=line(xx,546,xx+token.length*w,546,C.gold,6)+line(xx+token.length*w/2,552,xx+token.length*w/2,613,C.gold,2)+
      txt(129,731,meaning,65,C.gold,{bold:true});
  }else{
    s+=label(105,342,'GIT DIFF  /  CHANGED PATH')+txt(101,457,'tests/test_order_quantity.py',72,C.teal,{mono:true,bold:true})+
       line(105,528,1816,528,'#4b625c',2)+txt(108,617,'+  def test_rejects_zero(self):',48,C.bright,{mono:true})+
       txt(108,706,'+      self.assertFalse(is_valid_quantity(0))',48,C.bright,{mono:true});
  }
  return s+controls(i,progress);
}
function failureDetail(b,q){
  const values=info('red').lines,assertion=values.find(x=>x.startsWith('AssertionError:')),direct=values.find(x=>x.includes('self.assertFalse')).trim();
  const warm=b==='reason';
  let s=background(warm)+smallTitle(warm?'TRACEBACK   /   RECORDED EXCEPTION':'READ THE FAILURE TYPE',warm?'Read the assertion.':'Did the assertion run?',warm);
  if(warm){
    s+=label(113,359,'TEST_ORDER_QUANTITY.PY   /   LINE 17',true)+txt(111,457,direct,56,C.ink,{mono:true});
    s+=line(110,535,1808,535,'#a69d8d',2)+txt(105,620,assertion.split(': ')[0]+':',51,'#6d6758',{mono:true})+
      txt(99,747,assertion.split(': ')[1],91,C.rust,{mono:true,bold:true});
  }else{
    s+=label(108,343,'OBSERVED IN THIS RUN')+txt(104,455,'AssertionError',83,C.orange,{mono:true,bold:true})+
       txt(109,535,'The validator returned True for zero.',45,C.bright)+
       line(107,614,1810,614,'#4c5e60',2)+label(109,685,'DIFFERENT OUTCOME   /   HYPOTHETICAL')+
       txt(106,784,'An ImportError would stop the test before the assertion.',39,C.muted);
  }
  return s;
}
function operator(before,q,showResult){
  const p=before?0:reveal(q,.20,.81);
  let s=rect(0,0,1920,1080,C.black);
  // The zero index in the original optical macro is held like the real comparator's zero.
  s+=clip('operator-plate',1058,0,862,1080,img(plate,-122,0,2080,1171));
  s+=`<path d="M0 0H1290L1040 1080H0Z" fill="#131e21"/>`+line(1290,0,1040,1080,'#b29669',3);
  s+=label(101,141,'ONE-CHARACTER PATCH   /   ORDER_QUANTITY.PY:3')+
     txt(94,239,'Remove the equality.',74,C.bright,{bold:true});
  const bx=292,by=489;
  s+=line(bx-104,by-82,bx+44,by,'#f2e9d2',24,'stroke-linecap="square"')+
     line(bx+44,by,bx-104,by+82,'#f2e9d2',24,'stroke-linecap="square"');
  // The unchanged angle is pinned. Only the two equal-sign strokes travel off its rail.
  const dx=325*p,dy=74*p;
  s+=op(line(bx+161+dx,by-23+dy,bx+323+dx,by-23+dy,C.orange,22)+
        line(bx+161+dx,by+40+dy,bx+323+dx,by+40+dy,C.orange,22),1-p);
  s+=line(106,653,1040,653,'#6d7467',2)+txt(102,741,'-  return quantity >= 0',48,C.orange,{mono:true})+
     op(txt(101,816,'+  return quantity > 0',48,C.teal,{mono:true,bold:true}),p);
  return s;
}
function patchShot(b,q,progress,i){
  if(b==='edit'){
    if(q<.39)return background()+smallTitle('OPENVSCODE SERVER   /   ORIGINAL SOURCE','Inspect the comparison.')+sourceView('before',q/.39,'patch-old')+controls(i,progress);
    if(q>.76)return background()+smallTitle('OPENVSCODE SERVER   /   SAVED SOURCE','Check the edited line.')+sourceView('after',.53+(q-.76)*1.9,'patch-new')+controls(i,progress);
    return operator(false,(q-.39)/.37,false)+controls(i,progress);
  }
  let s=background(true)+smallTitle('PREDICTION   /   BEFORE THE NEXT RUN','Where does zero land?',true);
  const values=[[0,'False'],[5,'True'],[1,'True'],[-1,'False']],step=q<.45?0:Math.min(3,1+Math.floor((q-.45)/.185));
  const [v,ans]=values[step];
  s+=txt(120,475,v+' > 0',83,C.ink,{mono:true,bold:true})+txt(867,475,'→',78,'#7a7868')+txt(1095,475,ans,86,C.deep,{mono:true,bold:true});
  s+=rail({from:-1,to:5,active:v,light:true,p:q,y:659,mode:'green'});
  return s+controls(i,progress,true);
}
function comparison(q,progress,i){
  let s=background()+smallTitle('RECORDED TEST RESULTS   /   SAME ASSERTION','Follow one method across both runs.');
  s+=txt(98,377,'test_rejects_zero',74,C.bright,{mono:true,bold:true});
  s+=line(108,451,1807,451,'#415955',2)+label(108,531,'TEST-ONLY PATCH')+label(994,531,'AFTER FIX');
  s+=txt(102,681,'FAIL',99,C.orange,{bold:true,mono:true});
  const a=reveal(q,.14,.42);s+=line(486,630,933,630,'#456452',2)+op(slide(txt(990,679,'ok',110,C.teal,{bold:true,mono:true}),36*(1-a)),a);
  s+=txt(109,786,info('red').lines.at(-1),32,C.muted,{mono:true})+op(txt(995,786,info('green').lines.at(-1),32,C.muted,{mono:true}),a);
  return s+controls(i,progress);
}
function handoff(q,progress,i){
  let s=background(true)+smallTitle('HANDOFF   /   REPLAY IN THIS ORDER','Leave a chain of evidence.',true);
  const rows=[['01','Starting fixture','training source '+evidence.originRevision.slice(0,8)],['02','Regression patch','tests/test_order_quantity.py'],['03','Failing run',info('red').lines.at(-1)],['04','Source patch','order_quantity.py'],['05','Passing run','4 tests   /   '+info('green').lines.at(-1)]];
  for(let j=0;j<rows.length;j++){const y=330+j*96,active=reveal(q+.11,j*.125,j*.125+.16);
    s+=op(slide(txt(110,y,rows[j][0],26,C.deep,{mono:true})+txt(220,y,rows[j][1],44,C.ink,{bold:true})+
      txt(869,y,rows[j][2],39,'#4a5a51',{mono:true})+line(110,y+30,1807,y+30,'#c3c0b3',1),21*(1-active)),.25+.75*active);
  }return s+controls(i,progress,true);
}
function transferShot(b,q,progress,i){
  const light=b==='challenge'||b==='reveal',fg=light?C.ink:C.bright, accent=light?C.deep:C.teal;
  let s=background(light);
  if(b==='reveal' && q>.61){
    const ok=q>.82, item=info(ok?'upper-green':'upper-red');
    s+=smallTitle('SEPARATE PRACTICE   /   RECORDED TEST',ok?'Include the upper limit.':'Test the inclusive edge.',true);
    s+=txt(102,390,'self.assertTrue(accepts(100))',64,C.ink,{mono:true,bold:true})+
      line(106,462,1796,462,'#9e9c90',2)+label(108,556,'PRACTICE.PY',true)+
      txt(105,665,ok?'0 < quantity <= 100':'0 < quantity < 100',69,C.ink,{mono:true})+
      txt(108,795,item.lines.at(-1),55,ok?C.deep:C.rust,{mono:true,bold:true});
    return s+controls(i,progress,true);
  }
  if(b==='rule'||b==='why'){
    s+=smallTitle('SEPARATE PRACTICE   /   UPPER BOUNDARY',b==='rule'?'The upper end is inclusive.':'Read the rule at each edge.');
    s+=label(112,346,b==='rule'?'DRAFT EXPRESSION':'VERIFIED EXERCISE EXPRESSION')+
       txt(103,473,b==='rule'?'0 < quantity < 100':'0 < quantity <= 100',84,fg,{mono:true,bold:true})+
       rail({from:98,to:102,active:100,y:680,p:q,mode:b==='rule'?'neutral':'green'});
  }else{
    s+=smallTitle('SEPARATE PRACTICE   /   1 THROUGH 100',b==='challenge'?'Predict the return values.':'Check the three values.',true);
    const cases=[99,100,101],positions=[152,734,1316];
    cases.forEach((n,j)=>{
      const x=positions[j],row=info('transfer').lines[j].split(' '),a=b==='challenge'?0:reveal(q+.07,j*.1,j*.1+.15);
      s+=txt(x,465,n,109,fg,{bold:true,mono:true});
      s+=line(x,540,x+397,540,'#a5a192',2);
      if(b==='challenge')s+=txt(x,654,'?',76,'#678272',{bold:true,mono:true});else {
        s+=op(txt(x,638,row[2],66,j===1?C.deep:fg,{mono:true,bold:true})+
          txt(x,708,'draft  '+row[1],32,'#5a685e',{mono:true}),a);
      }
    });
    s+=txt(151,807,b==='challenge'?'Which input distinguishes the two upper limits?':'100 is accepted only when the upper limit includes equality.',39,accent,{bold:true});
  }
  return s+controls(i,progress,light);
}
function issue(q,progress){
  let s=background(true)+smallTitle('ISSUE.MD   /   TRAINING CHECKOUT','Read the order rule.',true);
  s+=label(110,351,'EXPECTED BEHAVIOR',true)+txt(101,484,'The minimum valid quantity is 1.',70,C.ink,{bold:true})+
     rail({light:true,y:671,active:mix(0,1,reveal(q,.18,.58)),mode:'green',p:q});
  return s+controls(0,progress,true);
}
function shot({key,beat,q,seconds,local,progress,i}){
  switch(key){
    case 'baseline':
      if(beat==='run')return seconds<4.15?optical(seconds,progress):issue(q,progress);
      if(beat==='method')return q<.46?background()+commandLine(local)+controls(i,progress):terminalShot('baseline',beat,(q-.46)/.54,progress,i);
      return background()+runnerNames('baseline',local,q)+controls(i,progress);
    case 'probe':return probeShot(beat,q,progress,i);
    case 'prediction':return predictionShot(beat,q,progress,i);
    case 'regression':return regressionShot(beat,q,progress,i);
    case 'red':
      if(beat==='run')return terminalShot('red',beat,q,progress,i);
      return failureDetail(beat,q)+controls(i,progress,beat==='reason');
    case 'patch':return patchShot(beat,q,progress,i);
    case 'green':return beat==='handoff'?handoff(q,progress,i):q<.46?terminalShot('green',beat,q/.46,progress,i):comparison((q-.46)/.54,progress,i);
    case 'transfer':return transferShot(beat,q,progress,i);
  }
}
function timeline(scene,progress,seconds,key){
  const duration=(scene.durationFrames||0)/24 || (seconds>0&&progress>0?seconds/progress:24);
  const seq=DEFAULTS[key], input=scene.beats||[];
  const withTimes=input.length>0 && input.every(v=>Number.isFinite(v.start) && seq.includes(v.id));
  let parts;
  if(withTimes)parts=input.map((b,i)=>({id:b.id,start:b.start,end:input[i+1]?.start??duration}));
  else if(input.length===seq.length&&input.every(v=>seq.includes(v.id))){
    const weights=input.map(b=>(b.text||'').split(/\s+/).length+(b.practiceHoldSeconds||0)*2.5),total=weights.reduce((a,b)=>a+b,0);
    let at=0;parts=input.map((b,i)=>{const start=at;at+=duration*weights[i]/total;return {id:b.id,start,end:at};});
  }else{parts=seq.map((id,i)=>({id,start:duration*i/seq.length,end:duration*(i+1)/seq.length}));}
  const cur=seconds<parts[0].start?parts[0]:parts.find(b=>seconds>=b.start && seconds<b.end)||parts.at(-1);
  return {beat:cur.id,local:Math.max(0,seconds-cur.start),q:clamp((seconds-cur.start)/Math.max(.001,cur.end-cur.start)),duration,parts};
}
function state(args){
  const scene=args.scene||{},provided=scene.id||'',key=STAGES.includes(provided)?provided:LEGACY[provided]||STAGES[clamp(Number(args.index)||0,0,7)];
  const i=STAGES.indexOf(key),progress=clamp(Number(args.progress)||0),seconds=Math.max(0,Number(args.seconds)||0);
  return {key,i,progress,seconds,...timeline(scene,progress,seconds,key)};
}
function frame(args){
  const v=state(args);
  let body=shot(v);
  // Make the recorded traceback and its enlarged transcription the two sides of a single optical edit.
  if(v.key==='red' && v.beat==='reason' && v.local<.46){
    const phase=ease(v.local/.46),edge=mix(-290,2200,phase);
    const previous=terminalShot('red','run',1,v.progress,4);
    const revealMask='<defs><clipPath id="trace-aperture"><path d="M0 0H'+num(edge+205)+'L'+num(edge-60)+' 1080H0Z"/></clipPath></defs>';
    body=previous+revealMask+g(body,'clip-path="url(#trace-aperture)"')+line(edge+205,0,edge-60,1080,C.gold,5);
  }
  // A shutter sweeps across the photograph on its transition into the teaching space.
  let streak='';
  if(v.key==='baseline'&&v.seconds>=4.15&&v.seconds<4.60){
    const k=(v.seconds-4.15)/.45,x=mix(-210,2120,ease(k));
    streak=clip('cut-m02',0,0,1920,1080,
      `<path d="M${num(x-105)} 0l135 0 -272 1080h-106z" fill="#e8d2a6" opacity="${num((1-k)*.55)}"/>`+
      line(x+29,0,x-243,1080,C.gold,6));
  }
  return full(baseDefs+body+streak);
}
// Fixed visual in the casting exercise isolates the voice as the variable.
function castingFrame(){return full(baseDefs+background()+smallTitle('ORDER QUANTITY   /   VOICE AUDITION','Read the original comparison.')+sourceView('before',.83,'casting')+controls(2,0));}
// Reuse the relevant two recorded shots to compare picture direction against the released v3 narration.
function compareFrame(args){
  const p=clamp(Number(args.progress)||0),i=args.scene?.id==='read-red'?4:5;
  if(i===4){
    const content=p<.45?terminalShot('red','run',p/.45,p,4):failureDetail('reason',(p-.45)/.55)+controls(4,p,true);
    return full(baseDefs+content);
  }
  let context;
  if(p<.24)context=background()+smallTitle('OPENVSCODE SERVER   /   ORIGINAL SOURCE','Inspect the source line.')+sourceView('before',p/.24,'compare-old')+controls(5,p);
  else if(p<.46)context=operator(false,(p-.24)/.22,false)+controls(5,p);
  else if(p<.64)context=background()+smallTitle('OPENVSCODE SERVER   /   SAVED SOURCE','Read the edited line.')+sourceView('after',.75,'compare-new')+controls(5,p);
  else if(p<.85)context=terminalShot('green','run',(p-.64)/.21,p,6);
  else context=comparison((p-.85)/.15,p,6);
  return full(baseDefs+context);
}
function beats(scene){
  const key=STAGES.includes(scene.id)?scene.id:LEGACY[scene.id]||'baseline';
  const d=(scene.durationFrames||576)/24;
  const marks=timeline(scene,0,0,key).parts;
  const points=marks.flatMap(b=>[b.start,b.start+.45,b.start+1,b.start+1.8,...[.14,.26,.39,.46,.55,.67,.76,.86].map(f=>b.start+(b.end-b.start)*f)]);
  if(key==='baseline')points.push(3.9,4.15,4.5);
  return [...new Set(points.filter(x=>x>=0&&x<d).map(x=>Number(x.toFixed(3))))].sort((a,b)=>a-b);
}
module.exports={frame,beats,castingFrame,compareFrame};
