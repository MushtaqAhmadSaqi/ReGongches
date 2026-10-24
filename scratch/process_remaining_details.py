import os
from PIL import Image, ImageEnhance

products_config = [
    {
        "id": 14,
        "slug": "hunza-embroidered-dress",
        "src": "assets/img/products/hunza-embroidered-dress/hunza-embroidered-dress-hero-black-with-multicolour.webp",
        "dst": "assets/img/products/hunza-embroidered-dress/hunza-embroidered-dress-detail.webp",
        "crop": (0.18, 0.12, 0.82, 0.68)
    },
    {
        "id": 15,
        "slug": "embroidered-womens-kameez",
        "src": "assets/img/products/embroidered-womens-kameez/embroidered-womens-kameez-hero-ivory.webp",
        "dst": "assets/img/products/embroidered-womens-kameez/embroidered-womens-kameez-detail.webp",
        "crop": (0.18, 0.10, 0.82, 0.65)
    },
    {
        "id": 16,
        "slug": "bridal-ceremonial-ensemble",
        "src": "assets/img/products/bridal-ceremonial-ensemble/bridal-ceremonial-ensemble-hero-maroon-gold.webp",
        "dst": "assets/img/products/bridal-ceremonial-ensemble/bridal-ceremonial-ensemble-detail.webp",
        "crop": (0.20, 0.15, 0.80, 0.70)
    },
    {
        "id": 17,
        "slug": "grooms-festive-set",
        "src": "assets/img/products/grooms-festive-set/grooms-festive-set-hero-cream.webp",
        "dst": "assets/img/products/grooms-festive-set/grooms-festive-set-detail.webp",
        "crop": (0.18, 0.10, 0.82, 0.65)
    },
    {
        "id": 18,
        "slug": "embroidered-handbag",
        "src": "assets/img/products/embroidered-handbag/embroidered-handbag-hero-black.webp",
        "dst": "assets/img/products/embroidered-handbag/embroidered-handbag-detail.webp",
        "crop": (0.15, 0.20, 0.85, 0.80)
    },
    {
        "id": 19,
        "slug": "embroidered-coin-purse",
        "src": "assets/img/products/embroidered-coin-purse/embroidered-coin-purse-hero-assorted.webp",
        "dst": "assets/img/products/embroidered-coin-purse/embroidered-coin-purse-detail.webp",
        "crop": (0.18, 0.22, 0.82, 0.78)
    },
    {
        "id": 20,
        "slug": "hand-woven-wool-belt",
        "src": "assets/img/products/hand-woven-wool-belt/hand-woven-wool-belt-hero-brown.webp",
        "dst": "assets/img/products/hand-woven-wool-belt/hand-woven-wool-belt-detail.webp",
        "crop": (0.18, 0.22, 0.82, 0.78)
    },
    {
        "id": 21,
        "slug": "embroidered-fabric-necklace",
        "src": "assets/img/products/embroidered-fabric-necklace/embroidered-fabric-necklace-hero-red-gold.webp",
        "dst": "assets/img/products/embroidered-fabric-necklace/embroidered-fabric-necklace-detail.webp",
        "crop": (0.18, 0.15, 0.82, 0.72)
    },
    {
        "id": 22,
        "slug": "embroidered-cushion-covers",
        "src": "assets/img/products/embroidered-cushion-covers/embroidered-cushion-covers-hero-cream.webp",
        "dst": "assets/img/products/embroidered-cushion-covers/embroidered-cushion-covers-detail.webp",
        "crop": (0.18, 0.18, 0.82, 0.82)
    },
    {
        "id": 23,
        "slug": "hand-woven-wool-table-runner",
        "src": "assets/img/products/hand-woven-wool-table-runner/hand-woven-wool-table-runner-hero-natural.webp",
        "dst": "assets/img/products/hand-woven-wool-table-runner/hand-woven-wool-table-runner-detail.webp",
        "crop": (0.18, 0.20, 0.82, 0.80)
    },
    {
        "id": 24,
        "slug": "heritage-gift-set",
        "src": "assets/img/products/heritage-gift-set/heritage-gift-set-hero-ivory-stole-set.webp",
        "dst": "assets/img/products/heritage-gift-set/heritage-gift-set-detail.webp",
        "crop": (0.16, 0.16, 0.84, 0.78)
    },
    {
        "id": 25,
        "slug": "mountain-keepsake-box",
        "src": "assets/img/products/mountain-keepsake-box/mountain-keepsake-box-hero-red-gold-edition.webp",
        "dst": "assets/img/products/mountain-keepsake-box/mountain-keepsake-box-detail.webp",
        "crop": (0.18, 0.18, 0.82, 0.78)
    },
    {
        "id": 26,
        "slug": "embroidered-heritage-wall-tapestry",
        "src": "assets/img/products/embroidered-heritage-wall-tapestry/embroidered-heritage-wall-tapestry-hero.webp",
        "dst": "assets/img/products/embroidered-heritage-wall-tapestry/embroidered-heritage-wall-tapestry-detail.webp",
        "crop": (0.16, 0.14, 0.84, 0.76)
    },
    {
        "id": 27,
        "slug": "highland-woven-wool-mittens",
        "src": "assets/img/products/highland-woven-wool-mittens/highland-woven-wool-mittens-hero.webp",
        "dst": "assets/img/products/highland-woven-wool-mittens/highland-woven-wool-mittens-detail.webp",
        "crop": (0.16, 0.18, 0.84, 0.78)
    }
]

for cfg in products_config:
    im = Image.open(cfg["src"])
    w, h = im.size
    crop_factors = cfg["crop"]
    left = int(w * crop_factors[0])
    top = int(h * crop_factors[1])
    right = int(w * crop_factors[2])
    bottom = int(h * crop_factors[3])
    cropped = im.crop((left, top, right, bottom))
    resized = cropped.resize((w, h), Image.Resampling.LANCZOS)
    enhancer = ImageEnhance.Sharpness(resized)
    sharpened = enhancer.enhance(1.25)
    sharpened.save(cfg["dst"], 'WEBP', quality=88)
    print(f"Product {cfg['id']} ({cfg['slug']}) detail created -> {cfg['dst']}")
