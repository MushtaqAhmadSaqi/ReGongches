import glob
import re

files = glob.glob('*.html')
pattern = re.compile(r'\s*<span style="font-weight:700;color:var\(--rg-antique-gold\);">DEMO STORE</span>', re.IGNORECASE)

count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    new_content, n = pattern.subn('', content)
    if n > 0:
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(new_content)
        count += n
        print(f'Updated {f}: removed {n} DEMO STORE')
print(f'Done! Total DEMO STORE removed: {count}')
