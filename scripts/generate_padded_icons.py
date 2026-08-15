from PIL import Image, ImageDraw
import numpy as np

# Load original logo mask
img = Image.open(r'C:\Users\Franck\web-apps\vendeur-ia\Code_Generated_Image (1).png')
alpha = np.array(img.split()[-1])
h, w = alpha.shape

# 1. Conteneur d'arrière-plan arrondi : VERT SOMBRE ÉLÉGANT LÉGÈREMENT PLUS CLAIR (#132620 = 19, 38, 32)
canvas = Image.new('RGBA', (h, w), (19, 38, 32, 255))
mask_bg = Image.new('L', (h, w), 0)
draw = ImageDraw.Draw(mask_bg)
draw.rounded_rectangle([(0, 0), (w, h)], radius=280, fill=255)

# 2. Logo bicolore
y_coords, x_coords = np.where(alpha > 128)
logo_rgba = np.zeros((h, w, 4), dtype=np.uint8)

for y, x in zip(y_coords, x_coords):
    if alpha[y, x] > 100:
        if (x > 610 and y < 450) or (x > 650 and y >= 450):
            # Right Branch: Emerald Green (#10b981)
            logo_rgba[y, x] = [16, 185, 129, alpha[y, x]]
        else:
            # Left Branch: Pure White (#ffffff)
            logo_rgba[y, x] = [255, 255, 255, alpha[y, x]]

logo_img = Image.fromarray(logo_rgba, 'RGBA')

# 3. Reduce logo scale to 78% (more breathing room / padding)
scale_factor = 0.78
new_w, new_h = int(w * scale_factor), int(h * scale_factor)
logo_scaled = logo_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

# Composite scaled logo onto container centered
offset_x = (w - new_w) // 2
offset_y = (h - new_h) // 2

final_icon = Image.composite(canvas, Image.new('RGBA', (h, w), (0,0,0,0)), mask_bg)
final_icon.paste(logo_scaled, (offset_x, offset_y), logo_scaled)

# Save icons
sizes = {
    'apple-touch-icon.png': (180, 180),
    'android-chrome-192x192.png': (192, 192),
    'android-chrome-512x512.png': (512, 512),
    'favicon-32x32.png': (32, 32),
    'favicon-16x16.png': (16, 16)
}

for filename, size in sizes.items():
    resized = final_icon.resize(size, Image.Resampling.LANCZOS)
    resized.save(rf'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public\{filename}')

final_icon.resize((64, 64), Image.Resampling.LANCZOS).save(r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public\favicon.ico')
print('Padded logo + lighter green container PNG icons generated successfully!')
