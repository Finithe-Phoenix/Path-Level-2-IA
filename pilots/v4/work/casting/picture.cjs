const fs=require('node:fs'),path=require('node:path');
const plate='data:image/jpeg;base64,'+fs.readFileSync(path.join(__dirname,'../M02/visual/art/zero-instrument.jpg'),'base64');
const trace=require('./single-test.json');
const xml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const ease=p=>{const t=Math.max(0,Math.min(1,p));return t*t*(3-2*t)};
const type=(x,y,t,size=62,fill='#faf6ec',weight=600,mono=false)=>
  '<text x="'+x+'" y="'+y+'" fill="'+fill+'" font-family="'+(mono?'DejaVu Sans Mono':'Open Sans')+'" font-size="'+size+'" font-weight="'+weight+'">'+xml(t)+'</text>';
const rect=(x,y,w,h,fill,rx=0)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rx+'" fill="'+fill+'"/>';
const colors={gold:'#f6c76b',teal:'#83dfc9',pink:'#ff988a',muted:'#9ca8ae'};
function frame({index,progress,seconds}) {
  const fade=ease(seconds/.32),sweep=ease(progress/.55);
  let body='';
  const sub=['Order intake','Read the existing test','Add the missing case','Run one test','Inspect the mismatch','Edit one operator','Check the boundary'];
  if(index===0){
    const z=1.01+.08*ease(progress);
    body='<image href="'+plate+'" x="'+(1920-1920*z)/2+'" y="'+(1080-1080*z)/2+'" width="'+(1920*z)+'" height="'+(1080*z)+'" preserveAspectRatio="xMidYMid slice"/><rect width="1920" height="1080" fill="url(#veil)"/>'+
      type(100,405,'Order quantity',64)+type(100,609,'0',205,colors.gold,700,true)+
      '<g opacity="'+ease((seconds-3.0)/.5)+'">'+type(103,741,'Should it pass?',79)+'</g>';
  } else {
    body='<rect width="1920" height="1080" fill="url(#base)"/>'+type(103,200,sub[index],86);
    const edge=310+6*Math.sin(progress*2),left=118;
    body+=rect(98,290,1720,578,'#19252d',18)+rect(98,290,1720,3,'#3a515a');
    if(index===1||index===2){
      const copy=index===2;
      body+=type(left+29,edge+74,'tests/test_order_quantity.py',42,colors.muted,400,true)+
        rect(145,451,1510*sweep,88,copy?'#364735':'#193e42',8)+
        type(165,513,copy?'def test_rejects_zero(self):':'def test_accepts_one(self):',62,copy?colors.gold:colors.teal,500,true)+
        type(165,668,copy?'    self.assertFalse(':'    self.assertTrue(',56,'#ece7d9',400,true)+
        type(165,756,copy?'        is_valid_quantity(0))':'        is_valid_quantity(1))',56,'#ece7d9',400,true);
    } else if(index===3||index===4||index===6){
      const fail=index!==6,cmd=trace.command.split(' -s ')[0],tail='-s '+trace.command.split(' -s ')[1];
      body+=type(151,398,'order-service  /  terminal',42,colors.muted,400,true);
      if(index===3){
        body+=type(151,539,'$ '+cmd,57,'#e6ede8',400,true)+
          type(151,624,tail.slice(0,Math.max(1,Math.round(tail.length*ease(seconds/2.0)))),54,'#e6ede8',400,true)+
          '<g opacity="'+ease((seconds-2.25)/.35)+'">'+type(151,774,'test_rejects_zero … FAIL',65,colors.pink,700,true)+'</g>';
      } else {
        body+=type(151,552,fail?'Expected: False':'test_rejects_zero … ok',80,fail?colors.teal:colors.teal,600,true)+
          '<g opacity="'+ease((seconds-.7)/.4)+'">'+type(151,685,fail?'Observed: True':'Ran 1 test',78,fail?colors.pink:'#e4e8e7',600,true)+'</g>'+
          type(151,794,fail?'AssertionError: True is not false':'OK',51,fail?colors.pink:colors.teal,500,true);
      }
    } else {
      const after=seconds>=1.8;
      body+=type(151,398,'order_quantity.py',45,colors.muted,400,true)+
        type(151,559,'return quantity',84,'#faf6ec',600,true)+
        rect(958,452,after?112:170,134,after?'#24473d':'#513c31',12)+
        type(979,557,after?'>':'>=',83,after?colors.teal:colors.gold,700,true)+
        type(after?1117:1186,557,'0',84,'#faf6ec',600,true)+
        type(151,761,after?'0 > 0     →  False':'0 >= 0    →  True',69,after?colors.teal:colors.gold,500,true);
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><defs><linearGradient id="base" x2=".9" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#172933"/><stop offset="1" stop-color="#0b1017"/></linearGradient><linearGradient id="veil"><stop stop-color="#0b1119" stop-opacity=".89"/><stop offset=".72" stop-color="#131b22" stop-opacity=".10"/></linearGradient></defs>'+body+rect(0,1049,1920,5,'#294044')+rect(0,1049,1920*(index+progress)/7,5,colors.teal)+'</svg>';
}
module.exports={frame};
