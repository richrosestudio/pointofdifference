#!/usr/bin/env python3
"""Trim and normalize timeline logos to a consistent 112x48 canvas (2x 56x24)."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "timeline-logos"
CANVAS_W, CANVAS_H = 112, 48

# source filename -> output filename, trim dark background, boost dark greys for white UI
SOURCES = [
    ("jcb-logo.png", "jcb.png", False, False),
    ("rio2016.png", "rio.png", True, False),
    ("comdir-logo.png", "comdir.png", False, False),
    ("prime-logo.png", "prime.png", True, False),
    ("jetpress-logo-2020.png", "jetpress-2020.png", False, False),
    ("jetpress-logo-2021.png", "jetpress-2021.png", False, True),
    ("tiktok-logo.png", "tiktok.png", True, False),
    ("components-direct-logo.png", "components-direct.png", True, False),
]

FIT_PADDING = 0.82


def trim_image(img: Image.Image, trim_dark: bool) -> Image.Image:
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    if trim_dark:
        pixels = img.load()
        w, h = img.size
        threshold = 40
        mask = Image.new("L", (w, h), 0)
        mask_px = mask.load()
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y]
                if a > 20 and (r + g + b) / 3 > threshold:
                    mask_px[x, y] = 255
        bbox = mask.getbbox()
    else:
        bbox = img.getbbox()

    if not bbox:
        return img
    return img.crop(bbox)


def boost_for_light_bg(img: Image.Image) -> Image.Image:
    """Raise near-black greys so marks read on a white timeline."""
    out = img.copy()
    pixels = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a < 128:
                continue
            if r > 80 and r > g + 20:
                continue
            lum = (r + g + b) / 3
            if lum < 80:
                pixels[x, y] = (85, 85, 85, a)
    return out


def fit_to_canvas(img: Image.Image) -> Image.Image:
    max_w = int(CANVAS_W * FIT_PADDING)
    max_h = int(CANVAS_H * FIT_PADDING)
    scale = min(max_w / img.width, max_h / img.height)
    new_w = max(1, int(img.width * scale))
    new_h = max(1, int(img.height * scale))
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    x = (CANVAS_W - new_w) // 2
    y = (CANVAS_H - new_h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for src_name, out_name, trim_dark, boost_dark in SOURCES:
        src = ROOT / src_name
        if not src.exists():
            raise FileNotFoundError(src)
        img = Image.open(src)
        trimmed = trim_image(img, trim_dark)
        if boost_dark:
            trimmed = boost_for_light_bg(trimmed)
        normalized = fit_to_canvas(trimmed)
        out_path = OUT / out_name
        normalized.save(out_path, "PNG")
        print(f"Wrote {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
