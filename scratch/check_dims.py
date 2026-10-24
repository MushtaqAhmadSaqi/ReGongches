from PIL import Image
import re

with open('assets/js/data/products.js', 'r', encoding='utf-8') as f:
    text = f.read()

seen = set()
for line in text.splitlines():
    if '"src": "assets/img/products/' in line and 'hero' in line:
        src = line.split('"src": "')[1].split('"')[0]
        if src not in seen:
            seen.add(src)
            try:
                im = Image.open(src)
                print(f"{src}: {im.size} {im.format}")
            except Exception as e:
                print(f"{src}: {e}")
