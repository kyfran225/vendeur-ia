from PIL import Image
import numpy as np

# Load original logo mask (alpha channel)
img = Image.open(r'C:\Users\Franck\web-apps\vendeur-ia\Code_Generated_Image (1).png')
alpha = np.array(img.split()[-1])

# Create RGBA array for 1254x1254 canvas
h, w = alpha.shape
rgba = np.zeros((h, w, 4), dtype=np.uint8)

# Left branch vs Right branch split along vertical/diagonal boundary
# Left branch path: x < 760 and y > (x - 200) approx, let's refine with x coordinate per row
y_coords, x_coords = np.where(alpha > 128)

# Separate into left branch and right branch
# Left branch: includes the main V stroke
# Right branch: x > 600 or top-right bar
for y, x in zip(y_coords, x_coords):
    if alpha[y, x] > 100:
        # Branch separation line: x = 600 + y*0.15 approximately or x > 620
        # In original image, right branch starts at top x ~ 610, bottom right x ~ 850
        if (x > 610 and y < 450) or (x > 650 and y >= 450):
            # Right Branch: Emerald Green (#10b981)
            rgba[y, x] = [16, 185, 129, alpha[y, x]]
        else:
            # Left Branch: Bright White (#ffffff)
            rgba[y, x] = [255, 255, 255, alpha[y, x]]

bicolor_img = Image.fromarray(rgba, 'RGBA')

# Save icons with crisp white + emerald bicolour logo
sizes = {
    'apple-touch-icon.png': (180, 180),
    'android-chrome-192x192.png': (192, 192),
    'android-chrome-512x512.png': (512, 512),
    'favicon-32x32.png': (32, 32),
    'favicon-16x16.png': (16, 16)
}

for filename, size in sizes.items():
    resized = bicolor_img.resize(size, Image.Resampling.LANCZOS)
    resized.save(rf'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public\{filename}')
    print(f'Saved {filename} {size}')

# Also save ICO
bicolor_img.resize((64, 64), Image.Resampling.LANCZOS).save(r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public\favicon.ico')
print('Saved bicolour favicon.ico successfully!')
