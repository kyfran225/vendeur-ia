import sys
sys.path.append(r"C:\Users\Franck\AppData\Roaming\Python\Python313\site-packages")
import glob
import os
import numpy as np
from PIL import Image
import potrace

# 1. Load the edited image
jpg_files = glob.glob(r'C:/Users/Franck/web-apps/vendeur-ia/Capture*183711.jpg')
if not jpg_files:
    raise FileNotFoundError("Could not find the target image.")

target_path = jpg_files[0]
print(f"Loading image: {target_path}")

img = Image.open(target_path).convert('RGB')
w, h = img.size

arr = np.array(img).astype(int)
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

# Accurate green segmentation
is_green = (g > 120) & (r < 110) & (b < 160)
print(f"Image size: {w}x{h}, Foreground pixels: {np.sum(is_green)}")

# 2. Potrace mathematical vector trace with subpixel Bezier curves
bmp = potrace.Bitmap(is_green)
# alphamax: 1.0 (smooth corners/curves), opttolerance: 0.2 (optimal bezier curve fitting)
path = bmp.trace(turdsize=2, alphamax=1.0, opttolerance=0.2)

bot_curves = []
all_x, all_y = [], []

for curve in path:
    pts_x = [curve.start_point.x] + [seg.end_point.x for seg in curve]
    pts_y = [curve.start_point.y] + [seg.end_point.y for seg in curve]
    min_cx, max_cx = min(pts_x), max(pts_x)
    min_cy, max_cy = min(pts_y), max(pts_y)

    # Filter out whole-canvas enclosing bounding box
    if min_cx == 0 and max_cx == w and min_cy == 0 and max_cy == h:
        continue

    bot_curves.append(curve)
    all_x.extend(pts_x)
    all_y.extend(pts_y)

print(f"Retained {len(bot_curves)} bot shape curves.")
min_x, max_x = min(all_x), max(all_x)
min_y, max_y = min(all_y), max(all_y)
print(f"Bot Bounding Box: X=[{min_x:.2f}, {max_x:.2f}] (width={max_x-min_x:.2f}), Y=[{min_y:.2f}, {max_y:.2f}] (height={max_y-min_y:.2f})")

# Format exact SVG path string (using cubic Bezier C commands and L commands)
svg_path_strs = []
for curve in bot_curves:
    start = curve.start_point
    p_str = f"M {start.x:.2f} {start.y:.2f}"
    for seg in curve:
        if seg.is_corner:
            p_str += f" L {seg.c.x:.2f} {seg.c.y:.2f} L {seg.end_point.x:.2f} {seg.end_point.y:.2f}"
        else:
            p_str += f" C {seg.c1.x:.2f} {seg.c1.y:.2f}, {seg.c2.x:.2f} {seg.c2.y:.2f}, {seg.end_point.x:.2f} {seg.end_point.y:.2f}"
    p_str += " Z"
    svg_path_strs.append(p_str)

full_d = " ".join(svg_path_strs)

# 1. Natural canvas viewBox matching original image dimensions
svg_natural = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="{full_d}" fill="#00B074" />
</svg>'''

with open(r'C:/Users/Franck/web-apps/vendeur-ia/bot-exact.svg', 'w', encoding='utf-8') as f:
    f.write(svg_natural)

# 2. Centered Square viewBox (clean padding, perfect for avatars / web icons)
pad = 24
bw = max_x - min_x
bh = max_y - min_y
side = max(bw, bh) + 2 * pad
cx = (min_x + max_x) / 2
cy = (min_y + max_y) / 2
vx = cx - side / 2
vy = cy - side / 2

# Standard 0 0 1000 1000 normalized viewBox version for maximum portability & precision
scale = 1000.0 / side
norm_paths = []
for curve in bot_curves:
    start_x = (curve.start_point.x - vx) * scale
    start_y = (curve.start_point.y - vy) * scale
    p_str = f"M {start_x:.1f} {start_y:.1f}"
    for seg in curve:
        if seg.is_corner:
            cx_pt = (seg.c.x - vx) * scale
            cy_pt = (seg.c.y - vy) * scale
            ex = (seg.end_point.x - vx) * scale
            ey = (seg.end_point.y - vy) * scale
            p_str += f" L {cx_pt:.1f} {cy_pt:.1f} L {ex:.1f} {ey:.1f}"
        else:
            c1x = (seg.c1.x - vx) * scale
            c1y = (seg.c1.y - vy) * scale
            c2x = (seg.c2.x - vx) * scale
            c2y = (seg.c2.y - vy) * scale
            ex = (seg.end_point.x - vx) * scale
            ey = (seg.end_point.y - vy) * scale
            p_str += f" C {c1x:.1f} {c1y:.1f}, {c2x:.1f} {c2y:.1f}, {ex:.1f} {ey:.1f}"
    p_str += " Z"
    norm_paths.append(p_str)

norm_d = " ".join(norm_paths)
svg_1000 = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="100%" height="100%" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="{norm_d}" fill="#00B074" />
</svg>'''

with open(r'C:/Users/Franck/web-apps/vendeur-ia/bot-icon-1000.svg', 'w', encoding='utf-8') as f:
    f.write(svg_1000)

print("Generated bot-exact.svg and bot-icon-1000.svg successfully!")
