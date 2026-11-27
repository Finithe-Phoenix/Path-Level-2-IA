"""Capture fresh Xfce Terminal pixels for the three real unittest runs on an isolated DISPLAY."""
import argparse
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
from record import HERE, SUITE, make_states

def capture(display,dest):
    if not display:
        raise ValueError('Pass --display for a dedicated X11 screen reserved for the synthetic lab.')
    env=dict(os.environ,DISPLAY=display,NO_AT_BRIDGE='1',GDK_BACKEND='x11',LC_ALL='C',
             PYTHONDONTWRITEBYTECODE='1',NO_COLOR='1',PYTHON_COLORS='0')
    dest.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='m02-terminal-') as temp:
        base=Path(temp)
        states,_=make_states(base)
        for name,state in [('baseline','baseline'),('red','red'),('green','green')]:
            title='Recorded quantity training '+name
            script=base/('screen-'+name+'.sh')
            done=base/('complete-'+name)
            script.write_text('#!/bin/bash\nprintf "training@workspace ~/order-lab\\n$ %s\\n" "'+SUITE+'"\n'+SUITE+"\ntouch '"+str(done)+"'\nexec sleep 30\n")
            term=subprocess.Popen(['xfce4-terminal','--disable-server','--hide-menubar','--hide-toolbar',
                '--hide-borders','--hide-scrollbar','--font=DejaVu Sans Mono 13','--geometry=114x31+0+0',
                '--color-bg=#10161c','--color-text=#e3e8e9','--dynamic-title-mode=none','--title='+title,
                '--working-directory='+str(states[state]),'-x','bash',str(script)],env=env,
                stderr=subprocess.DEVNULL,stdout=subprocess.DEVNULL)
            try:
                window=None
                for _ in range(100):
                    tree=subprocess.check_output(['xwininfo','-root','-tree'],env=env,text=True)
                    match=re.search(r'(0x[0-9a-f]+) "'+re.escape(title)+'"',tree)
                    if match and done.exists():
                        window=match[1]; break
                    if term.poll() is not None:
                        raise RuntimeError('Xfce Terminal closed before the capture')
                    time.sleep(.12)
                if not window: raise RuntimeError('No completed synthetic terminal window')
                time.sleep(.45)
                subprocess.run(['import','-window',window,'+repage',str(dest/('native-'+name+'.png'))],env=env,check=True)
            finally:
                term.terminate(); term.wait(timeout=5)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--display',required=True);p.add_argument('--out',type=Path,default=HERE/'evidence')
    a=p.parse_args();capture(a.display,a.out)
