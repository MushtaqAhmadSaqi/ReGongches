import re

with open('index.html', encoding='utf-8') as f:
    t = f.read()

products = re.findall(r"id:\s*'([a-z0-9\-]+)'", t)
print(f"Products in SR_PRODUCTS: {len(products)}")
print(f"List of products: {products}")
