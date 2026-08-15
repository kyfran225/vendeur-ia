from PIL import Image
import numpy as np
from skimage import measure

img = Image.open(r'C:\Users\Franck\web-apps\vendeur-ia\Code_Generated_Image (1).png')
alpha = np.array(img.split()[-1])

contours = measure.find_contours(alpha, 128)
print(f'Found {len(contours)} contours')

svg_paths = []
for c in contours:
    # simplify contour with Douglas-Peucker (approximate_polygon)
    poly = measure.approximate_polygon(c, tolerance=1.2)
    print(f'Original pts: {len(c)}, Simplified pts: {len(poly)}')
    path_data = 'M ' + ' L '.join([f'{pt[1]:.2f},{pt[0]:.2f}' for pt in poly]) + ' Z'
    svg_paths.append(path_data)

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {alpha.shape[1]} {alpha.shape[0]}" width="100%" height="100%">
  <g fill="currentColor">
'''
for p in svg_paths:
    svg_content += f'    <path d="{p}" />\n'
svg_content += '''  </g>
</svg>'''

with open(r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public\logo.svg', 'w') as f:
    f.write(svg_content)

print('Exact SVG written successfully!')
