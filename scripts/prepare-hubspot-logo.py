#!/usr/bin/env python3
"""Convert HubSpot wordmark JPEG (black bg) to transparent PNG for white UI."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "hubspot-logo-source.jpg"
OUT = ROOT / "hubspot-logo.png"
BLACK_THRESHOLD = 28


def main() -> None:
    img = Image.open(SOURCE).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out_px = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if max(r, g, b) <= BLACK_THRESHOLD:
                continue
            out_px[x, y] = (r, g, b, a)

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
