import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]
updated = []

button_html = '    <button type="button" class="rg-style-switcher__btn" data-rg-theme-set="walnut-ochre">5. Walnut &amp; Ochre</button>\n'

for fname in sorted(html_files):
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'data-rg-theme-set="walnut-ochre"' in content:
        continue

    # Look for the festive button
    # Pattern: (<button[^>]+data-rg-theme-set="festive"[^>]*>.*?</button>)
    pattern = r'(<button[^>]+data-rg-theme-set="festive"[^>]*>4\. Festive</button>)'
    
    match = re.search(pattern, content, flags=re.IGNORECASE)
    if match:
        old_btn = match.group(1)
        # Determine indentation of the matched button
        line_start = content.rfind('\n', 0, match.start()) + 1
        indent = content[line_start:match.start()]
        new_btn = f'{old_btn}\n{indent}<button type="button" class="rg-style-switcher__btn" data-rg-theme-set="walnut-ochre">5. Walnut &amp; Ochre</button>'
        new_content = content[:match.start()] + new_btn + content[match.end():]
        
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(new_content)
        updated.append(fname)
    else:
        print(f"Warning: festive button not found in {fname}")

print(f"Successfully updated {len(updated)} HTML files: {updated}")
