"""Produce the single-case stdout used by the blind audition's picture."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
base=Path(__file__).resolve().parent
fixture=base.parent/"M02/visual/fixture"
with tempfile.TemporaryDirectory() as temp:
    lab=Path(temp)/"order-service"
    shutil.copytree(fixture,lab,ignore=shutil.ignore_patterns("__pycache__","*.pyc"))
    suite=lab/"tests/test_order_quantity.py"
    with suite.open("a") as f:
        f.write("\n    def test_rejects_zero(self):\n        self.assertFalse(is_valid_quantity(0))\n")
    args=[sys.executable,"-B","-m","unittest","discover","-s","tests","-k","rejects_zero","-v"]
    def run():return subprocess.run(args,cwd=lab,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
    red=run()
    source=lab/"order_quantity.py"
    source.write_text(source.read_text().replace("quantity >= 0","quantity > 0"))
    green=run()
    assert red.returncode==1 and green.returncode==0
    assert "True is not false" in red.stdout and "Ran 1 test" in green.stdout
    (base/"single-test.json").write_text(json.dumps({"command":"python -B -m unittest discover -s tests -k rejects_zero -v",
      "before":red.stdout.replace(str(lab)+"/",""),"after":green.stdout.replace(str(lab)+"/","")},indent=2)+"\n")
