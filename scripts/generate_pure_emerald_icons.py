from PIL import Image
import numpy as np

# Load original logo mask
img = Image.open(r'C:\Users\Franck\web-apps\vendeur-ia\Code_Generated_Image (1).png')
alpha = np.array(img.split()[-1])

h, w = alpha.shape

# 100% Emerald Green (#10b981) on transparent background
y_coords, x_coords = np.where(alpha > 128)
logo_rgba = np.zeros((h, w, 4), dtype=np.uint8)

for y, x in zip(y_coords, x_coords):
    if alpha[y, x] > 100:
        logo_rgba[y, x] = [16, 185, 129, alpha[y, x]]

emerald_logo = Image.fromarray(logo_rgba, 'RGBA')

# Save icons
sizes = {
    'apple-touch-icon.png': (180, 180),
    'android-chrome-192x192.png': (192, 192),
    'android-chrome-512x512.png': (512, 512),
    'favicon-32x32.png': (32, 32),
    'favicon-16x16.png': (16, 16)
}

for filename, size in sizes.items():
    resized = emerald_logo.resize(size, Image.Resampling.LANCZOS)
    resized.save(rf'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public\{filename}')

# Save ICO
emerald_logo.resize((64, 64), Image.Resampling.LANCZOS).save(r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public\favicon.ico')
print('Saved pure 100% Emerald transparent icons successfully!')
