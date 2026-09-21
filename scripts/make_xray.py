"""Build x-ray locked to body silhouette (same size, same outline)."""
from PIL import Image, ImageFilter, ImageEnhance, ImageOps, ImageChops
import numpy as np
from pathlib import Path

root = Path(r"c:\Users\it13\Desktop\Сайт СТО\assets\img")
body_path = root / "hero-car-body.png"
# Prefer the detailed internals render
candidates = [
    Path(r"C:\Users\it13\.cursor\projects\c-Users-it13-Desktop\assets\hero-car-xray-v2.png"),
    Path(r"C:\Users\it13\.cursor\projects\c-Users-it13-Desktop\assets\hero-car-xray-raw.png"),
    root / "hero-car-xray-raw.png",
    root / "hero-car-xray.png",
]
raw_path = next(p for p in candidates if p.exists())
out_path = root / "hero-car-xray.png"

body = Image.open(body_path).convert("RGB")
raw = Image.open(raw_path).convert("RGB")
W, H = body.size
raw = raw.resize((W, H), Image.Resampling.LANCZOS)

ba = np.asarray(body).astype(np.float32)
ra = np.asarray(raw).astype(np.float32)


def luminance(a):
    return 0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1] + 0.0722 * a[:, :, 2]


def hard_mask(a, thr=10.0):
    return (luminance(a) > thr).astype(np.uint8)


def bbox_of(mask):
    ys, xs = np.where(mask > 0)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


mb = hard_mask(ba)
mr = hard_mask(ra)
bx0, by0, bx1, by1 = bbox_of(mb)
rx0, ry0, rx1, ry1 = bbox_of(mr)

# Place internals into the EXACT body car bounding box
raw_car = raw.crop((rx0, ry0, rx1, ry1)).resize((bx1 - bx0, by1 - by0), Image.Resampling.LANCZOS)
aligned = Image.new("RGB", (W, H), (0, 0, 0))
aligned.paste(raw_car, (bx0, by0))
aa = np.asarray(aligned).astype(np.float32)

# Soft silhouette strictly from BODY (pixel-identical outline)
soft = np.clip((luminance(ba) - 5.0) / 20.0, 0.0, 1.0)
soft = np.asarray(
    Image.fromarray((soft * 255).astype(np.uint8), "L")
    .filter(ImageFilter.GaussianBlur(0.7))
).astype(np.float32) / 255.0

# Ghost shell from the real body (edges + translucent panels)
gray = ImageOps.grayscale(body)
edges = ImageEnhance.Contrast(gray.filter(ImageFilter.FIND_EDGES)).enhance(2.8)
e = np.asarray(edges).astype(np.float32) / 255.0
inv = 255.0 - luminance(ba)

shell_r = inv * 0.12 + e * 40
shell_g = inv * 0.28 + e * 110
shell_b = inv * 0.45 + e * 180

# Internals from aligned AI x-ray (boost mid detail)
warm = np.clip(aa[:, :, 0] - aa[:, :, 2], 0, 255)
int_r = aa[:, :, 0] * 0.85 + warm * 0.25
int_g = aa[:, :, 1] * 1.05
int_b = np.clip(aa[:, :, 2] * 1.18, 0, 255)

# Where AI has structure, prefer it; else keep shell — still clipped to body mask
ai_strength = np.clip(luminance(aa) / 90.0, 0.0, 1.0)[..., None]
shell = np.stack([shell_r, shell_g, shell_b], axis=-1)
internals = np.stack([int_r, int_g, int_b], axis=-1)
mixed = shell * (1.0 - ai_strength * 0.92) + internals * (ai_strength * 0.92)

# Lock to body silhouette — identical footprint
mixed = np.clip(mixed, 0, 255) * soft[..., None]

out = Image.fromarray(mixed.astype(np.uint8), "RGB")
out = ImageEnhance.Contrast(out).enhance(1.12)
out = ImageEnhance.Color(out).enhance(1.2)

# Final hard composite on black with body mask
mask_img = Image.fromarray((soft * 255).astype(np.uint8), "L")
out = Image.composite(out, Image.new("RGB", (W, H), (0, 0, 0)), mask_img)

# Ensure identical dimensions
assert out.size == body.size
out.save(out_path, optimize=True)
print("source", raw_path.name)
print("saved", out_path, out.size, "body", body.size)
print("bbox body", (bx0, by0, bx1, by1), "bbox raw", (rx0, ry0, rx1, ry1))
