"""Record the synthetic quantity exercise in a real PTY. Python and Git only."""
import argparse
import fcntl
import json
import os
from pathlib import Path
import pty
import re
import select
import shutil
import struct
import subprocess
import tempfile
import termios
import time

HERE = Path(__file__).resolve().parent
SUITE = 'python -B -m unittest discover -s tests -v'
PROBE = 'python -B -c "from order_quantity import is_valid_quantity; print(is_valid_quantity(0))"'
TRANSFER = '''python -B -c "for q in (99, 100, 101): print(q, 0 < q < 100, 0 < q <= 100)"'''
ASSERTION = '\n    def test_rejects_zero(self):\n        self.assertFalse(is_valid_quantity(0))\n'
ORIGIN = '5d0254a9f129834b8d0a8d7c8c1e59bb7367335b'


def make_states(base):
    initial = base / 'baseline'
    shutil.copytree(HERE / 'fixture', initial)
    env = dict(os.environ, GIT_AUTHOR_NAME='Training capture', GIT_AUTHOR_EMAIL='training@localhost',
               GIT_COMMITTER_NAME='Training capture', GIT_COMMITTER_EMAIL='training@localhost',
               GIT_AUTHOR_DATE='2026-01-01T00:00:00Z', GIT_COMMITTER_DATE='2026-01-01T00:00:00Z',
               GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL=os.devnull)
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=initial, env=env, text=True).strip()
    git('init','-q','-b','training'); git('add','.')
    git('commit','-qm','Baseline from the public training fixture')
    revision = git('rev-parse','HEAD')
    red = base / 'red'
    shutil.copytree(initial, red)
    test = red / 'tests/test_order_quantity.py'
    test.write_text(test.read_text() + ASSERTION)
    green = base / 'green'
    shutil.copytree(red, green)
    source = green / 'order_quantity.py'
    source.write_text(source.read_text().replace('quantity >= 0','quantity > 0'))
    states = dict(baseline=initial, red=red, green=green)
    practice_test = ('import unittest\nfrom practice import accepts\n\n'
                     'class UpperLimitTests(unittest.TestCase):\n'
                     '    def test_accepts_upper_limit(self):\n'
                     '        self.assertTrue(accepts(100))\n')
    for name, operator in [('practice-red','<'),('practice-green','<=')]:
        practice = base / name
        practice.mkdir()
        (practice / 'practice.py').write_text(f'def accepts(quantity):\n    return 0 < quantity {operator} 100\n')
        (practice / 'test_practice.py').write_text(practice_test)
        states[name] = practice
    return states, revision


def take(command, directory):
    pid, fd = pty.fork()
    if pid == 0:
        os.chdir(directory)
        os.environ.update(PS1='lab$ ', TERM='dumb', LC_ALL='C', HISTFILE=os.devnull,
                          PYTHONDONTWRITEBYTECODE='1', NO_COLOR='1', PYTHON_COLORS='0')
        os.execvp('bash', ['bash','--norc','--noprofile','-i'])
    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH', 36, 144, 0, 0))
    start = time.monotonic()
    events = []
    def drain_until(target):
        buf = ''
        deadline = time.monotonic() + 15
        while not buf.endswith(target):
            if time.monotonic() > deadline:
                raise TimeoutError((command,buf))
            if not select.select([fd],[],[],.2)[0]:
                continue
            raw = os.read(fd,16384).decode('utf-8',errors='replace')
            events.append([round(time.monotonic()-start,5),'o',raw])
            buf += raw
        return buf
    try:
        drain_until('lab$ ')
        for c in command:
            os.write(fd,c.encode())
            if select.select([fd],[],[],.015)[0]:
                events.append([round(time.monotonic()-start,5),'o',os.read(fd,16384).decode()])
            time.sleep(.016)
        os.write(fd,b'\n')
        drain_until('lab$ ')
        os.write(fd,b'exit\n')
        os.waitpid(pid,0)
    finally:
        os.close(fd)
    screen=''.join(item[2] for item in events).replace('\r','')
    first=screen.index('\n')+1
    output=screen[first:].removesuffix('lab$ ').rstrip()
    return events,output


def record(dest):
    dest.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='quantity-lab-') as tmp:
        states,revision=make_states(Path(tmp))
        shots=[('baseline','baseline',SUITE),('probe','baseline',PROBE),('source','baseline','nl -ba order_quantity.py'),
               ('regression','red','git diff -- tests/test_order_quantity.py'),('red','red',SUITE),
               ('patch','green','git diff -- order_quantity.py'),('green','green',SUITE),('transfer','green',TRANSFER),
               ('upper-red','practice-red','python -B -m unittest -v test_practice'),
               ('upper-green','practice-green','python -B -m unittest -v test_practice')]
        data = dict(originRevision=ORIGIN,fixtureRevision=revision,runtime=subprocess.check_output(['python','-V'],text=True).strip(),takes={})
        for name,state,command in shots:
            events,output=take(command,states[state])
            # The traceback points to the genuine temporary checkout; a separate display excerpt removes its machine-specific prefix.
            cast=dest/(name+'.cast')
            header=dict(version=2,width=144,height=36,title=name,env={'SHELL':'/bin/bash','TERM':'dumb'})
            cast.write_text('\n'.join([json.dumps(header)]+[json.dumps(v,ensure_ascii=False) for v in events])+'\n')
            (dest/(name+'.txt')).write_text(output+'\n')
            lines=output.splitlines()
            tests=[dict(name=m[1],status=m[2]) for line in lines if (m:=re.match(r'^(test_\w+) \(.*?\) \.\.\. (ok|FAIL)$',line))]
            data['takes'][name]=dict(command=command,lines=lines,tests=tests,original=cast.name)
        ts=data['takes']
        assert ts['probe']['lines']==['True']
        assert len(ts['baseline']['tests'])==3 and ts['baseline']['lines'][-1]=='OK'
        assert 'AssertionError: True is not false' in ts['red']['lines'] and ts['red']['lines'][-1]=='FAILED (failures=1)'
        assert len(ts['green']['tests'])==4 and ts['green']['lines'][-1]=='OK'
        assert ts['transfer']['lines']==['99 True True','100 False True','101 False False']
        assert ts['upper-red']['lines'][-1]=='FAILED (failures=1)' and ts['upper-green']['lines'][-1]=='OK'
        (dest/'takes.json').write_text(json.dumps(data,indent=2)+'\n')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,default=HERE/'evidence')
    record(parser.parse_args().out)
