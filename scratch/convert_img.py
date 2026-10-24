import sys
from PIL import Image

def convert_to_webp(src, dst):
    im = Image.open(src)
    im = im.convert('RGB')
    im.save(dst, 'WEBP', quality=85)
    print(f"Converted {src} -> {dst}")

if __name__ == '__main__':
    if len(sys.argv) >= 3:
        convert_to_webp(sys.argv[1], sys.argv[2])
