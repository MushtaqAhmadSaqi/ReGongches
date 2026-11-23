import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets

ARTIFACTS_DIR = r"C:\Users\Miraan gee\.gemini\antigravity\brain\c99b96d5-d410-4002-895e-92624061d882"
PAGES = [
    ("size-guide", "http://localhost:8085/size-guide.html"),
    ("product", "http://localhost:8085/product.html?id=1"),
    ("authenticity", "http://localhost:8085/authenticity.html"),
    ("shop", "http://localhost:8085/shop.html")
]

async def audit_page(ws_url, page_name, page_url):
    console_errors = []
    console_logs = []

    async with websockets.connect(ws_url, max_size=10*1024*1024) as ws:
        msg_id = 0
        async def send(method, params=None):
            nonlocal msg_id
            msg_id += 1
            payload = {"id": msg_id, "method": method}
            if params:
                payload["params"] = params
            await ws.send(json.dumps(payload))
            return msg_id

        await send("Page.enable")
        await send("Runtime.enable")
        await send("Log.enable")
        await send("Emulation.setDeviceMetricsOverride", {
            "width": 1280,
            "height": 900,
            "deviceScaleFactor": 1,
            "mobile": False
        })

        await send("Page.navigate", {"url": page_url})

        start_time = time.time()
        while time.time() - start_time < 8:
            try:
                resp = await asyncio.wait_for(ws.recv(), timeout=1.0)
                data = json.loads(resp)
                method = data.get("method", "")
                if method == "Page.loadEventFired":
                    break
                elif method == "Runtime.exceptionThrown":
                    console_errors.append(data["params"])
                elif method == "Log.entryAdded":
                    entry = data["params"]["entry"]
                    if entry.get("level") in ("error", "warning"):
                        console_errors.append(entry)
                elif method == "Runtime.consoleAPICalled":
                    call_type = data["params"].get("type")
                    if call_type in ("error", "warn"):
                        console_errors.append(data["params"])
                    else:
                        console_logs.append(data["params"])
            except asyncio.TimeoutError:
                pass

        await asyncio.sleep(1)

        eval_script = """
        (() => {
            const th = document.querySelector('table th');
            const td = document.querySelector('table td');
            const badge = document.querySelector('.rg-badge');
            const tabBtn = document.querySelector('.wc-tabs button, .wc-tabs a');
            const chip = document.querySelector('.rg-chip');

            return {
                thFontWeight: th ? window.getComputedStyle(th).fontWeight : null,
                thTransform: th ? window.getComputedStyle(th).textTransform : null,
                tdTabularNums: td ? window.getComputedStyle(td).fontVariantNumeric : null,
                badgeAlign: badge ? window.getComputedStyle(badge).verticalAlign : null,
                tabCursor: tabBtn ? window.getComputedStyle(tabBtn).cursor : null,
                chipCursor: chip ? window.getComputedStyle(chip).cursor : null
            };
        })()
        """
        eval_id = await send("Runtime.evaluate", {"expression": eval_script, "returnByValue": True})
        eval_result = None
        while True:
            resp = await ws.recv()
            data = json.loads(resp)
            if data.get("id") == eval_id:
                eval_result = data.get("result", {}).get("result", {}).get("value")
                break

        # Screenshot
        snap_id = await send("Page.captureScreenshot", {"format": "png"})
        while True:
            resp = await ws.recv()
            data = json.loads(resp)
            if data.get("id") == snap_id:
                img_data = data["result"]["data"]
                import base64
                out_path = os.path.join(ARTIFACTS_DIR, f"phase2-{page_name}.png")
                with open(out_path, "wb") as f:
                    f.write(base64.b64decode(img_data))
                print(f"[OK] Screenshot saved: {out_path}")
                break

    return {
        "page": page_name,
        "url": page_url,
        "errors": console_errors,
        "metrics": eval_result
    }

async def main():
    chrome_cmd = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "--headless",
        "--disable-gpu",
        "--remote-debugging-port=9224",
        r"--user-data-dir=C:\Users\Miraan gee\AppData\Local\Temp\chrome-dbg-phase2"
    ]
    proc = subprocess.Popen(chrome_cmd)
    time.sleep(2)

    try:
        results = []
        for name, url in PAGES:
            req = urllib.request.Request("http://127.0.0.1:9224/json/new?" + url, method="PUT")
            with urllib.request.urlopen(req) as resp:
                tab_info = json.loads(resp.read().decode())
                ws_url = tab_info["webSocketDebuggerUrl"]
                tab_id = tab_info["id"]

            res = await audit_page(ws_url, name, url)
            results.append(res)

            close_req = urllib.request.Request(f"http://127.0.0.1:9224/json/close/{tab_id}")
            try:
                urllib.request.urlopen(close_req)
            except Exception:
                pass

        print("\n=== PHASE 2 VERIFICATION REPORT ===")
        for r in results:
            print(f"\nPage: {r['page']} ({r['url']})")
            print(f"Console Errors: {len(r['errors'])}")
            if r['errors']:
                print("Error items:", r['errors'])
            print(f"Component Metrics: {r['metrics']}")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(main())
