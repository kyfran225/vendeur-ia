from PIL import Image, ImageDraw
import numpy as np
from scipy.ndimage import label
import os

# Paths
source_img_path = r'C:\Users\Franck\web-apps\vendeur-ia\Code_Generated_Image (1).png'
output_dir = r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public'
output_file = os.path.join(output_dir, 'logo-social-square.png')

# Load original logo mask
img = Image.open(source_img_path)
alpha = np.array(img.split()[-1])
h, w = alpha.shape

# 1. Full square background (no rounded corners for social profiles)
# Using the Dark Emerald background #07100d
bg_color = (7, 16, 13, 255)
final_icon = Image.new('RGBA', (h, w), bg_color)

# 2. Extract logo components
labeled, num_features = label(alpha > 128)
logo_rgba = np.zeros((h, w, 4), dtype=np.uint8)

# Component 1: Left Branch (White)
comp1_mask = (labeled == 1)
logo_rgba[comp1_mask] = [255, 255, 255, 255]

# Component 2: Right Branch (Emerald #10b981)
comp2_mask = (labeled == 2)
logo_rgba[comp2_mask] = [16, 185, 129, 255]

# Apply anti-aliasing from original alpha
for c in range(3):
    logo_rgba[:, :, c] = (logo_rgba[:, :, c].astype(float) * (alpha / 255.0)).astype(np.uint8)
logo_rgba[:, :, 3] = alpha

logo_img = Image.fromarray(logo_rgba, 'RGBA')

# 3. Scale logo for circular crop safety (70% instead of 80%)
scale_factor = 0.70
new_w, new_h = int(w * scale_factor), int(h * scale_factor)
logo_scaled = logo_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

# Center the logo
offset_x = (w - new_w) // 2
offset_y = (h - new_h) // 2
final_icon.paste(logo_scaled, (offset_x, offset_y), logo_scaled)

# 4. Save as 512x512 square PNG
resized = final_icon.resize((512, 512), Image.Resampling.LANCZOS)
resized.save(output_file)

print(f'Social logo (square) generated at: {output_file}')
