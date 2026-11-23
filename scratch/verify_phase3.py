import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets

ARTIFACTS_DIR = r"C:\Users\Miraan gee\.gemini\antigravity\brain\c99b96d5-d410-4002-895e-92624061d882"

TESTS = [
    {
        "name": "size-guide-mobile",
        "url": "http://localhost:8085/size-guide.html",
        "width": 390,
        "height": 844,
        "mobile": True
    },
    {
        "name": "size-guide-desktop",
        "url": "http://localhost:8085/size-guide.html",
        "width": 1280,
        "height": 900,
        "mobile": False
    },
    {
        "name": "cart-mobile",
        "url": "http://localhost:8085/cart.html",
        "width": 390,
        "height": 844,
        "mobile": True
    },
    {
        "name": "journal-post-mobile",
        "url": "http://localhost:8085/journal-post.html",
        "width": 390,
        "height": 844,
        "mobile": True
    },
    {
        "name": "index-mobile",
        "url": "http://localhost:8085/index.html",
        "width": 390,
        "height": 844,
        "mobile": True
    }
]

async def audit_view(ws_url, cfg):
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
            "width": cfg["width"],
            "height": cfg["height"],
            "deviceScaleFactor": 2 if cfg["mobile"] else 1,
            "mobile": cfg["mobile"]
        })

        await send("Page.navigate", {"url": cfg["url"]})

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
            const docEl = document.documentElement;
            const body = document.body;
            const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
            const clientWidth = docEl.clientWidth;
            const hasHorizontalOverflow = scrollWidth > (clientWidth + 1);

            // Table thead check
            const tableThead = document.querySelector('.rg-table-scroll table thead, .shop_table thead');
            const theadDisplay = tableThead ? window.getComputedStyle(tableThead).display : null;

            return {
                clientWidth: clientWidth,
                scrollWidth: scrollWidth,
                hasHorizontalOverflow: hasHorizontalOverflow,
                theadDisplay: theadDisplay
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
                out_path = os.path.join(ARTIFACTS_DIR, f"phase3-{cfg['name']}.png")
                with open(out_path, "wb") as f:
                    f.write(base64.b64decode(img_data))
                print(f"[OK] Screenshot saved: {out_path}")
                break

    return {
        "test": cfg["name"],
        "url": cfg["url"],
        "errors": console_errors,
        "metrics": eval_result
    }

async def main():
    chrome_cmd = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "--headless",
        "--disable-gpu",
        "--remote-debugging-port=9225",
        r"--user-data-dir=C:\Users\Miraan gee\AppData\Local\Temp\chrome-dbg-phase3"
    ]
    proc = subprocess.Popen(chrome_cmd)
    time.sleep(2)

    try:
        results = []
        for cfg in TESTS:
            req = urllib.request.Request("http://127.0.0.1:9225/json/new?" + cfg["url"], method="PUT")
            with urllib.request.urlopen(req) as resp:
                tab_info = json.loads(resp.read().decode())
                ws_url = tab_info["webSocketDebuggerUrl"]
                tab_id = tab_info["id"]

            res = await audit_view(ws_url, cfg)
            results.append(res)

            close_req = urllib.request.Request(f"http://127.0.0.1:9225/json/close/{tab_id}")
            try:
                urllib.request.urlopen(close_req)
            except Exception:
                pass

        print("\n=== PHASE 3 VERIFICATION REPORT ===")
        for r in results:
            print(f"\nTest: {r['test']} ({r['url']})")
            print(f"Console Errors: {len(r['errors'])}")
            if r['errors']:
                print("Error items:", r['errors'])
            print(f"Overflow & Table Metrics: {r['metrics']}")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(main())
