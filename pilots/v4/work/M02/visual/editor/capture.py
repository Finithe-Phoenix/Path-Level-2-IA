"""Capture the real source editor against a temporary synthetic training checkout."""
import argparse
import json
from pathlib import Path
import secrets
import shutil
import signal
import socket
import subprocess
import tempfile
import time
from urllib.parse import urlencode
from playwright.sync_api import sync_playwright

def capture(engine, fixture, output, chromium):
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="editor-training-") as temp:
        root = Path(temp)
        lab = root / "order-service"
        lab.mkdir()
        shutil.copy2(fixture / "order_quantity.py", lab / "order_quantity.py")
        shutil.copytree(fixture / "tests", lab / "tests",ignore=shutil.ignore_patterns("__pycache__","*.pyc"))
        if (fixture / "ISSUE.md").is_file():
            shutil.copy2(fixture / "ISSUE.md", lab / "ISSUE.md")
        cfg=lab / ".vscode"; cfg.mkdir()
        settings={"editor.fontSize":32,"editor.lineHeight":49,"editor.minimap.enabled":False,
                  "editor.cursorBlinking":"solid","editor.fontFamily":"DejaVu Sans Mono",
                  "workbench.colorTheme":"Default Dark Modern","workbench.startupEditor":"none",
                  "chat.disableAIFeatures":True,"workbench.secondarySideBar.defaultVisibility":"hidden",
                  "workbench.tips.enabled":False,"workbench.editor.showTabs":"multiple",
                  "editor.stickyScroll.enabled":False,"explorer.compactFolders":False,
                  "files.exclude":{".vscode":True},"telemetry.telemetryLevel":"off",
                  "editor.accessibilitySupport":"off","editor.inlineSuggest.enabled":False}
        (cfg/"settings.json").write_text(json.dumps(settings))
        userdata=root/"user"; machine=userdata/"User"; machine.mkdir(parents=True)
        (machine/"settings.json").write_text(json.dumps(dict(settings,**{"security.workspace.trust.enabled":False})))
        token=secrets.token_urlsafe(32); auth=root/"connection-token";auth.write_text(token)
        with socket.socket() as s:
            s.bind(("127.0.0.1",0)); port=s.getsockname()[1]
        with (root/"server.log").open("w") as log:
            server=subprocess.Popen([str(engine),"--host","127.0.0.1","--port",str(port),
                "--connection-token-file",str(auth),"--server-data-dir",str(root/"data"),
                "--user-data-dir",str(userdata),"--extensions-dir",str(root/"extensions"),
                "--disable-telemetry"],stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
            try:
                for step in range(100):
                    try:
                        with socket.create_connection(("127.0.0.1",port),timeout=.2):break
                    except OSError:time.sleep(.15)
                    if server.poll() is not None:raise RuntimeError("Local editor exited before startup")
                with sync_playwright() as pw:
                    browser=pw.chromium.launch(executable_path=chromium,headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
                    page=browser.new_page(viewport={"width":1920,"height":1080},device_scale_factor=1)
                    page.goto("http://127.0.0.1:"+str(port)+"/?"+urlencode({"folder":str(lab),"tkn":token}),wait_until="domcontentloaded")
                    page.locator(".monaco-workbench").wait_for(state="attached",timeout=120000)
                    source=page.locator(".explorer-viewlet .monaco-list-row").filter(has_text="order_quantity.py")
                    line=page.locator(".view-line").filter(has_text="return quantity")
                    for attempt in range(8):
                        trust=page.get_by_text("Yes, I trust the authors",exact=False)
                        if trust.count() and trust.first.is_visible():trust.first.click()
                        if line.count() and line.first.is_visible():break
                        if source.count() and source.first.is_visible():
                            source.first.dblclick()
                        else:
                            page.keyboard.press("Escape");page.keyboard.press("Control+p")
                            quick=page.locator(".quick-input-widget input").first
                            try:
                                quick.wait_for(state="visible",timeout=5000);quick.fill("order_quantity.py")
                                item=page.locator(".quick-input-list .monaco-list-row").filter(has_text="order_quantity.py").first
                                item.wait_for(state="visible",timeout=3000);item.click()
                            except Exception:
                                page.keyboard.press("Escape")
                        page.wait_for_timeout(850)
                    if not line.count() or not line.first.is_visible():
                        page.screenshot(path=str(Path(tempfile.gettempdir())/"workshop-editor-diagnostic.png"))
                        raise RuntimeError("Source editor did not open")
                    line.first.click()
                    page.keyboard.press("Escape")
                    # Capture a clean file and then perform the one-character edit through the editor.
                    page.keyboard.press("Control+End");page.keyboard.press("ArrowUp");page.keyboard.press("End")
                    for _ in range(2):page.keyboard.press("ArrowLeft")
                    for _ in range(2):page.keyboard.press("Shift+ArrowLeft")
                    page.mouse.move(1880,1020);page.wait_for_timeout(550)
                    page.screenshot(path=str(output/"before.png"),animations="disabled")
                    page.keyboard.press("ArrowRight");page.keyboard.press("End")
                    for _ in range(2):page.keyboard.press("ArrowLeft")
                    page.keyboard.press("Backspace");page.keyboard.press("Control+s")
                    page.wait_for_timeout(600)
                    if (lab/"order_quantity.py").read_text().strip().splitlines()[-1].strip()!="return quantity > 0":
                        raise ValueError("Workbench did not persist the expected one-character edit")
                    page.keyboard.press("Shift+ArrowLeft");page.wait_for_timeout(200)
                    page.screenshot(path=str(output/"after.png"),animations="disabled")
                    print("Captured both versions in OpenVSCode Server, saved operator checked.")
                    browser.close()
            finally:
                import os
                try:os.killpg(server.pid,signal.SIGTERM)
                except ProcessLookupError:pass
                server.wait(timeout=12)
if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--engine",type=Path,required=True);p.add_argument("--fixture",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True);p.add_argument("--chromium",default="/usr/bin/chromium")
    args=p.parse_args();capture(args.engine.resolve(),args.fixture.resolve(),args.output.resolve(),args.chromium)
