from PIL import Image, ImageDraw
import numpy as np
from scipy.ndimage import label

# Load original logo mask
img = Image.open(r'C:\Users\Franck\web-apps\vendeur-ia\Code_Generated_Image (1).png')
alpha = np.array(img.split()[-1])
h, w = alpha.shape

# 1. Conteneur d'arrière-plan arrondi Vert Sombre Vendeur IA (#07100d = 7, 16, 13)
canvas = Image.new('RGBA', (h, w), (7, 16, 13, 255))
mask_bg = Image.new('L', (h, w), 0)
draw = ImageDraw.Draw(mask_bg)
draw.rounded_rectangle([(0, 0), (w, h)], radius=260, fill=255)

# 2. Utilisation de la SEPARATION EXACTE des 2 composantes connexes (Aucun débordement !)
labeled, num_features = label(alpha > 128)

logo_rgba = np.zeros((h, w, 4), dtype=np.uint8)

# Component 1: Branche Gauche (Oblique V) -> BLANC PUR (#ffffff)
comp1_mask = (labeled == 1)
logo_rgba[comp1_mask] = [255, 255, 255, 255]

# Component 2: Branche Droite (Forme 7/Accent) -> VERT ÉMERAUDE (#10b981)
comp2_mask = (labeled == 2)
logo_rgba[comp2_mask] = [16, 185, 129, 255]

# Conserver le lissage des bords (anti-aliasing)
for c in range(3):
    logo_rgba[:, :, c] = (logo_rgba[:, :, c].astype(float) * (alpha / 255.0)).astype(np.uint8)
logo_rgba[:, :, 3] = alpha

logo_img = Image.fromarray(logo_rgba, 'RGBA')

# 3. Échelle à 80% (Padding élégant) & centrage dans le conteneur
scale_factor = 0.80
new_w, new_h = int(w * scale_factor), int(h * scale_factor)
logo_scaled = logo_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

offset_x = (w - new_w) // 2
offset_y = (h - new_h) // 2

final_icon = Image.composite(canvas, Image.new('RGBA', (h, w), (0,0,0,0)), mask_bg)
final_icon.paste(logo_scaled, (offset_x, offset_y), logo_scaled)

# 4. Enregistrement des icônes d'onglet PNG & ICO 100% exactes
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
print('EXACT_TILED_PNG_ICONS_GENERATED_WITHOUT_BLEED')
