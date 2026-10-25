import glob
import re

files = glob.glob('*.html')
pattern = re.compile(r'<footer class="site-footer" id="colophon">.*?<!-- RG:FOOTER END -->', re.DOTALL)
found = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        c = fp.read()
    if pattern.search(c):
        found += 1
    else:
        print(f'Pattern NOT matched in {f}')
print(f'Matched {found} out of {len(files)}')
