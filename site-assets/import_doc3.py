#!/usr/bin/env python3
"""Импорт из «Для сайта 3.docx»: копирование и нарезка image2 на 6 иконок."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "from-doc3"
PROD = ROOT / "products"
ICONS = PROD / "icons-v3"
PROD.mkdir(parents=True, exist_ok=True)
ICONS.mkdir(parents=True, exist_ok=True)


def split_vertical_strip(path: Path, n: int = 6) -> list[Image.Image]:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    h_each = max(1, h // n)
    out = []
    for i in range(n):
        y0 = i * h_each
        y1 = h if i == n - 1 else (i + 1) * h_each
        out.append(im.crop((0, y0, w, y1)))
    return out


def main() -> None:
    assert (SRC / "image2.png").exists(), "Сначала извлеките PNG из docx в from-doc3/"
    parts = split_vertical_strip(SRC / "image2.png", 6)
    for i, p in enumerate(parts, 1):
        p.save(ICONS / f"shared-icon-{i:02d}.png")

    mapping = {
        "guava-main.png": "image1.png",
        "forest-mint-main.png": "image3.png",
        "strawberry-main.png": "image5.png",
        "cucumber-mint-main.png": "image7.png",
        "guava-game-fall.png": "image1.png",
        "forest-mint-game-fall.png": "image4.png",
        "strawberry-game-fall.png": "image6.png",
        "cucumber-mint-game-fall.png": "image8.png",
        "ext-breath-spray-main.png": "image10.png",
        "ext-lozenges-main.png": "image12.png",
        "ext-floss-main.png": "image14.png",
        "ext-kit-main.png": "image16.png",
        "banner-breath-spray.png": "image9.png",
        "banner-lozenges.png": "image11.png",
        "banner-floss.png": "image13.png",
        "banner-kit.png": "image15.png",
    }
    for dst, src in mapping.items():
        data = (SRC / src).read_bytes()
        (PROD / dst).write_bytes(data)
        print(dst, "<-", src)


if __name__ == "__main__":
    main()
