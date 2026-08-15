from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\Franck\web-apps\vendeur-ia\Code_Generated_Image (1).png')
alpha = np.array(img.split()[-1])

contours = measure.find_contours(alpha, 128) if False else None
# Write exact separated SVG with Vendeur IA dark green tile container (#07100d)
# Path 0: Left Branch, Path 1: Right Branch
from generate_logo_tsx import paths

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254">
  <g>
    <!-- Conteneur d'arrière-plan arrondi Vert Sombre Vendeur IA (#07100d) -->
    <rect x="0" y="0" width="1254" height="1254" rx="280" fill="#07100d" />

    <!-- Logo séparé à 78% d'échelle centré -->
    <g transform="translate(137.94, 137.94) scale(0.78)">
      <!-- Branche Gauche : BLANC PUR (#ffffff) -->
      <path fill="#ffffff" d="{paths[0]}" />
      <!-- Branche Droite : VERT ÉMERAUDE (#10b981) -->
      <path fill="#10b981" d="{paths[1]}" />
    </g>
  </g>
</svg>'''

with open(r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public\favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print('FAVICON_SVG_EXACT_TILED_WRITTEN')
