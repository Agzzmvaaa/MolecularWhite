#!/usr/bin/env python3
"""
Нарезка PNG из «Для сайта.docx» по той же логике, что у Guava:
- основной визуал (левая часть слайда, ~34% ширины);
- две зоны иконок (правая часть делится пополам по горизонтали);
- спрайт для игры = тот же кроп, что и основной визуал.

image4.png — слайд с двумя пастами рядом: левая половина → Strawberry, правая → Forest mint.
image5.png — один вертикальный слайд → Fresh cucumber & mint.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image


def split_like_guava(region: Image.Image, prefix: str, out_dir: Path) -> dict[str, str]:
    """Кропы в духе Guava: main | [icon_left | icon_right]."""
    region = region.convert("RGBA")
    w, h = region.size
    main_w = max(80, int(w * 0.34))
    main = region.crop((0, 0, main_w, h))
    rest = region.crop((main_w, 0, w, h))
    rw, rh = rest.size
    if rw < 4:
        icon1 = icon2 = None
    else:
        icon1 = rest.crop((0, 0, rw // 2, rh))
        icon2 = rest.crop((rw // 2, 0, rw, rh))

    paths: dict[str, str] = {}
    main_path = out_dir / f"{prefix}-main.png"
    main.save(main_path)
    paths["image"] = str(main_path.relative_to(out_dir.parent.parent))

    icon_paths = []
    if icon1 is not None:
        p1 = out_dir / f"{prefix}-icon-1.png"
        icon1.save(p1)
        icon_paths.append(str(p1.relative_to(out_dir.parent.parent)))
    if icon2 is not None:
        p2 = out_dir / f"{prefix}-icon-2.png"
        icon2.save(p2)
        icon_paths.append(str(p2.relative_to(out_dir.parent.parent)))
    paths["icons"] = icon_paths

    game_path = out_dir / f"{prefix}-game-fall.png"
    main.save(game_path)
    paths["gameFallingImage"] = str(game_path.relative_to(out_dir.parent.parent))

    return paths


def main() -> None:
    root = Path(__file__).resolve().parent
    products_dir = root / "products"
    products_dir.mkdir(parents=True, exist_ok=True)

    img4 = Image.open(products_dir / "image4.png")
    w4, h4 = img4.size
    left4 = img4.crop((0, 0, w4 // 2, h4))
    right4 = img4.crop((w4 // 2, 0, w4, h4))

    strawberry = split_like_guava(left4, "strawberry", products_dir)
    forest = split_like_guava(right4, "forest-mint", products_dir)

    img5 = Image.open(products_dir / "image5.png")
    cucumber = split_like_guava(img5, "cucumber-mint", products_dir)

    # Пути для JSON (относительно папки с HTML: Международный менеджмент/)
    base = "site-assets/products"
    print("strawberry:", strawberry)
    print("forest-mint:", forest)
    print("cucumber:", cucumber)

    # Sanity: also copy guava assets names unchanged (already exist)
    assert (products_dir / "image1.png").exists()


if __name__ == "__main__":
    main()
