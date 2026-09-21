from PIL import Image, ImageFilter, ImageEnhance, ImageOps, ImageChops
import numpy as np
from pathlib import Path

src = Path(r"c:\Users\it13\Desktop\Сайт СТО\assets\img\hero-car-body.png")
dst = Path(r"c:\Users\it13\Desktop\Сайт СТО\assets\img\hero-car-xray.png")

img = Image.open(src).convert("RGB")
arr = np.asarray(img).astype(np.float32)

lum = 0.2126 * arr[:, :, 0] + 0.7152 * arr[:, :, 1] + 0.0722 * arr[:, :, 2]
mask = np.clip((lum - 6.0) / 24.0, 0.0, 1.0)

gray = ImageOps.grayscale(img)

# Multi-scale edges = chassis / panel lines
e1 = gray.filter(ImageFilter.FIND_EDGES)
e1 = ImageEnhance.Contrast(e1).enhance(2.8)
e2 = gray.filter(ImageFilter.GaussianBlur(1.2)).filter(ImageFilter.FIND_EDGES)
e2 = ImageEnhance.Contrast(e2).enhance(2.0)
emb = gray.filter(ImageFilter.EMBOSS)
emb = ImageOps.autocontrast(emb)

e = np.maximum(
    np.asarray(e1).astype(np.float32),
    np.asarray(e2).astype(np.float32) * 0.85,
) / 255.0
emb_a = np.asarray(emb).astype(np.float32) / 255.0

# Translucent “flesh”: dark blue fill inside silhouette
fill = np.clip(40 + lum * 0.18, 0, 90)

# Bone / frame from inverted midtones + emboss
bones = np.clip((255.0 - lum) * 0.35 + emb_a * 140.0, 0, 255)

# Wireframe glow from edges
wire = e * 255.0

# Compose channels — medical cyan x-ray
r = fill * 0.25 + bones * 0.25 + wire * 0.55
g = fill * 0.55 + bones * 0.55 + wire * 0.95
b = fill * 0.95 + bones * 0.85 + wire * 1.25

# Orange hotspots from original warm reflections (brakes/side glow)
warm = np.clip(arr[:, :, 0] * 1.1 - arr[:, :, 2], 0, 255) / 255.0
r = r + warm * 200.0
g = g + warm * 70.0

# Keep bright lamps white-cyan
spec = np.clip((lum - 150.0) / 70.0, 0, 1)
r = r + spec * 160
g = g + spec * 200
b = b + spec * 255

out = np.clip(np.stack([r, g, b], axis=-1), 0, 255)
final_img = Image.fromarray(out.astype(np.uint8), mode="RGB")

# Soft bloom on wires
bloom = final_img.filter(ImageFilter.GaussianBlur(radius=3))
final_img = Image.blend(final_img, bloom, 0.28)
final_img = ImageEnhance.Contrast(final_img).enhance(1.15)
final_img = ImageEnhance.Color(final_img).enhance(1.25)

# Identical silhouette on pure black
mimg = Image.fromarray((mask * 255).astype(np.uint8), mode="L")
# Feather mask slightly so edges match body anti-aliasing
mimg = mimg.filter(ImageFilter.GaussianBlur(radius=0.6))
black = Image.new("RGB", final_img.size, (0, 0, 0))
final_img = Image.composite(final_img, black, mimg)

final_img.save(dst, optimize=True)
print("saved", dst, final_img.size)
