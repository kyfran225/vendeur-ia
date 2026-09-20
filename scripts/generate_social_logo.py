from PIL import Image, ImageDraw, ImageChops
import numpy as np
from scipy.ndimage import label
import os

# Paths
source_img_path = r'C:\Users\Franck\web-apps\vendeur-ia\scripts\Code_Generated_Image (1).png'
output_dir = r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public'
output_file = os.path.join(output_dir, 'logo-social-square.png')

# Load original logo mask
img = Image.open(source_img_path)
alpha = np.array(img.split()[-1])
h, w = alpha.shape

# 1. Conteneur arrondi MODÉRÉ (100px au lieu de 280px pour YouTube)
# Couleur : Vert Sombre Vendeur IA (#07100d)
canvas = Image.new('RGBA', (h, w), (7, 16, 13, 255))
mask_bg = Image.new('L', (h, w), 0)
draw = ImageDraw.Draw(mask_bg)
draw.rounded_rectangle([(0, 0), (w, h)], radius=100, fill=255)

# 2. Extraction du logo bicolore
labeled, num_features = label(alpha > 128)
logo_rgba = np.zeros((h, w, 4), dtype=np.uint8)

# Branche Gauche -> BLANC PUR (#ffffff)
comp1_mask = (labeled == 1)
logo_rgba[comp1_mask] = [255, 255, 255, 255]

# Branche Droite -> VERT ÉMERAUDE (#10b981)
comp2_mask = (labeled == 2)
logo_rgba[comp2_mask] = [16, 185, 129, 255]

# Anti-aliasing
for c in range(3):
    logo_rgba[:, :, c] = (logo_rgba[:, :, c].astype(float) * (alpha / 255.0)).astype(np.uint8)
logo_rgba[:, :, 3] = alpha

logo_img = Image.fromarray(logo_rgba, 'RGBA')

# 2b. Aberration Chromatique (-16, -4) et (16, 4)
r, g, b, a = logo_img.split()
r_shifted = ImageChops.offset(r, -16, -4)
b_shifted = ImageChops.offset(b, 16, 4)
logo_chromatic = Image.merge('RGBA', (r_shifted, g, b_shifted, a))

# 3. Échelle 78% (comme le logo officiel)
scale_factor = 0.78
new_w, new_h = int(w * scale_factor), int(h * scale_factor)
logo_scaled = logo_chromatic.resize((new_w, new_h), Image.Resampling.LANCZOS)

offset_x = (w - new_w) // 2
offset_y = (h - new_h) // 2

# Composition finale
final_icon = Image.composite(canvas, Image.new('RGBA', (h, w), (0,0,0,0)), mask_bg)
final_icon.paste(logo_scaled, (offset_x, offset_y), logo_scaled)

# 4. Sauvegarde en 512x512
final_icon.resize((512, 512), Image.Resampling.LANCZOS).save(output_file)
print(f'Logo social généré avec arrondi optimisé et glitch : {output_file}')
