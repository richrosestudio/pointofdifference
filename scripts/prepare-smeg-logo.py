#!/usr/bin/env python3
"""Convert Smeg logo JPEG to transparent PNG with dark (#111) mark on white UI."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "smeg-logo-source.jpg"
OUT = ROOT / "smeg-logo.png"
LOGO_COLOR = (17, 17, 17)
BG_THRESHOLD = 245


def main() -> None:
    img = Image.open(SOURCE).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out_px = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b, _a = pixels[x, y]
            lum = max(r, g, b)
            if lum >= BG_THRESHOLD:
                continue
            # Map anti-aliased greys to dark logo with proportional alpha
            alpha = min(255, int((BG_THRESHOLD - lum) / (BG_THRESHOLD - 20) * 255))
            out_px[x, y] = (*LOGO_COLOR, alpha)

    bbox = out.getbbox()
    if not bbox:
        raise SystemExit("No visible pixels after thresholding; need a higher-contrast source.")

    cropped = out.crop(bbox)
    pad = 4
    padded = Image.new(
        "RGBA",
        (cropped.width + pad * 2, cropped.height + pad * 2),
        (0, 0, 0, 0),
    )
    padded.paste(cropped, (pad, pad))
    padded.save(OUT, "PNG")
    print(f"Wrote {OUT} ({padded.width}x{padded.height})")


if __name__ == "__main__":
    main()
