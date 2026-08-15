from PIL import Image
import numpy as np
from skimage import measure

img = Image.open(r'C:\Users\Franck\web-apps\vendeur-ia\Code_Generated_Image (1).png')
alpha = np.array(img.split()[-1])

contours = measure.find_contours(alpha, 128)
print(f'Found {len(contours)} contours')

paths = []
for i, c in enumerate(contours):
    poly = measure.approximate_polygon(c, tolerance=1.0)
    path_d = 'M ' + ' L '.join([f'{pt[1]:.2f},{pt[0]:.2f}' for pt in poly]) + ' Z'
    paths.append(path_d)

# Path 0: Left Branch, Path 1: Right Branch
svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {alpha.shape[1]} {alpha.shape[0]}" width="100%" height="100%">
  <g>
    <!-- Branche Gauche : Gris Platine (#cbd5e1) -->
    <path fill="#cbd5e1" d="{paths[0]}" />
    <!-- Branche Droite : Vert Émeraude (#10b981) -->
    <path fill="#10b981" d="{paths[1]}" />
  </g>
</svg>'''

with open(r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public\logo.svg', 'w') as f:
    f.write(svg_content)

print('EXACT_SEPARATED_SVG_CREATED')
