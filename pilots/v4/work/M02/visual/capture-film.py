"""Film a real, uninterrupted Xfce Terminal run on the dedicated X11 display supplied by the caller."""
import argparse
import ctypes as c
from ctypes.util import find_library
import os
from pathlib import Path
import re
import signal
import subprocess
import tempfile
import time
from record import HERE, SUITE, make_states


class Keyboard:
    """Send normal X11 key events to the selected synthetic terminal window."""
    def __init__(self, display, window):
        self.x = c.CDLL(find_library('X11'))
        self.test = c.CDLL(find_library('Xtst'))
        self.x.XOpenDisplay.argtypes = [c.c_char_p]
        self.x.XOpenDisplay.restype = c.c_void_p
        self.x.XSetInputFocus.argtypes = [c.c_void_p, c.c_ulong, c.c_int, c.c_ulong]
        self.x.XStringToKeysym.argtypes = [c.c_char_p]
        self.x.XStringToKeysym.restype = c.c_ulong
        self.x.XKeysymToKeycode.argtypes = [c.c_void_p, c.c_ulong]
        self.x.XKeysymToKeycode.restype = c.c_uint
        self.x.XFlush.argtypes = [c.c_void_p]
        self.x.XCloseDisplay.argtypes = [c.c_void_p]
        self.test.XTestFakeKeyEvent.argtypes = [c.c_void_p, c.c_uint, c.c_int, c.c_ulong]
        self.screen = self.x.XOpenDisplay(display.encode())
        if not self.screen:
            raise RuntimeError('Cannot open the dedicated X display')
        self.x.XSetInputFocus(self.screen, int(window,16), 1, 0)
        self.x.XFlush(self.screen)

    def event(self, key, down):
        symbol=self.x.XStringToKeysym(key.encode())
        code=self.x.XKeysymToKeycode(self.screen,symbol)
        if not code: raise ValueError(key)
        self.test.XTestFakeKeyEvent(self.screen,code,int(down),0)

    def type(self, command):
        keys={' ':'space', '-':'minus', '.':'period', '_':'underscore', '>':'greater',
              '=':'equal', '/':'slash', "'":'apostrophe'}
        for ch in command:
            key=keys.get(ch,ch.lower())
            shifted=ch.isupper() or ch in '>_'
            if shifted:self.event('Shift_L',True)
            self.event(key,True);self.event(key,False)
            if shifted:self.event('Shift_L',False)
            self.x.XFlush(self.screen)
            time.sleep(.04)
        self.event('Return',True);self.event('Return',False);self.x.XFlush(self.screen)

    def close(self):
        self.x.XCloseDisplay(self.screen)


def capture(display, dest):
    env=dict(os.environ,DISPLAY=display,NO_AT_BRIDGE='1',GDK_BACKEND='x11',LC_ALL='C',
             PYTHONDONTWRITEBYTECODE='1',NO_COLOR='1',PYTHON_COLORS='0',PAGER='cat',GIT_PAGER='cat')
    with tempfile.TemporaryDirectory(prefix='m02-continuous-') as tmp:
        base=Path(tmp);states,_=make_states(base);directory=states['red']
        rc=base/'bashrc'
        rc.write_text("PS1='lab$ '\nunset PROMPT_COMMAND\nHISTFILE=/dev/null\n")
        title='M02 continuous terminal capture'
        term=subprocess.Popen(['xfce4-terminal','--disable-server','--hide-menubar','--hide-toolbar',
            '--hide-borders','--hide-scrollbar','--font=DejaVu Sans Mono 15','--geometry=103x33+0+0',
            '--color-bg=#10161c','--color-text=#e3e8e9','--dynamic-title-mode=none','--title='+title,
            '--working-directory='+str(directory),'-x','bash','--noprofile','--rcfile',str(rc),'-i'],env=env,
            stderr=subprocess.DEVNULL,stdout=subprocess.DEVNULL)
        film=None;keyboard=None
        try:
            for _ in range(100):
                tree=subprocess.check_output(['xwininfo','-root','-tree'],env=env,text=True)
                found=re.search(r'(0x[0-9a-f]+) "'+re.escape(title)+'"',tree)
                if found:break
                time.sleep(.1)
            if not found:raise RuntimeError('The synthetic terminal did not open.')
            wid=found[1];keyboard=Keyboard(display,wid);dest.parent.mkdir(parents=True,exist_ok=True)
            film=subprocess.Popen(['ffmpeg','-v','error','-y','-f','x11grab','-framerate','24',
                '-draw_mouse','0','-window_id',str(int(wid,16)),'-i',display,'-an','-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2',
                '-c:v','libx264','-threads','1','-preset','veryfast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',
                str(dest)],stdin=subprocess.DEVNULL,env=env)
            time.sleep(1.1)
            for cmd,hold in [(SUITE,3.3),("sed -i 's/>= 0/> 0/' order_quantity.py",.9),
                             ('git diff -- order_quantity.py',2.6),(SUITE,3.5)]:
                keyboard.type(cmd);time.sleep(hold)
            if film.poll() is not None:raise RuntimeError('Terminal recorder exited early')
            if 'return quantity > 0' not in (directory/'order_quantity.py').read_text():
                raise RuntimeError('The actual terminal edit did not save.')
            subprocess.run(SUITE.split(),cwd=directory,env=env,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        finally:
            if film and film.poll() is None:
                film.send_signal(signal.SIGINT);film.wait(timeout=15)
            if keyboard:keyboard.close()
            term.terminate();term.wait(timeout=5)
    print(dest)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--display',required=True);p.add_argument('--out',type=Path,required=True)
    a=p.parse_args();capture(a.display,a.out)
