from PIL import Image
import numpy as np
from skimage import measure

img = Image.open(r'C:\Users\Franck\web-apps\vendeur-ia\Code_Generated_Image (1).png')
alpha = np.array(img.split()[-1])

contours = measure.find_contours(alpha, 128)
paths = []
for i, c in enumerate(contours):
    poly = measure.approximate_polygon(c, tolerance=1.0)
    path_d = 'M ' + ' L '.join([f'{pt[1]:.2f},{pt[0]:.2f}' for pt in poly]) + ' Z'
    paths.append(path_d)

tsx_content = f'''import React from "react";
import {{ cn }} from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {{
  size?: number | string;
  className?: string;
  leftBranchColor?: string;
  rightBranchColor?: string;
}}

export const Logo: React.FC<LogoProps> = ({{
  size = 24,
  className,
  leftBranchColor = "#cbd5e1",
  rightBranchColor = "#10b981",
  ...props
}}) => {{
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 {alpha.shape[1]} {alpha.shape[0]}"
      width={{size}}
      height={{size}}
      className={{cn("shrink-0 transition-colors duration-200", className)}}
      {{...props}}
    >
      <g>
        {{/* Branche Gauche (Oblique V) - Tracé exact 100% indépendant */}}
        <path fill={{leftBranchColor}} d="{paths[0]}" />
        {{/* Branche Droite (Forme 7) - Tracé exact 100% indépendant */}}
        <path fill={{rightBranchColor}} d="{paths[1]}" />
      </g>
    </svg>
  );
}};
'''

with open(r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\src\components\ui\Logo.tsx', 'w', encoding='utf-8') as f:
    f.write(tsx_content)

print('LOGO_TSX_EXACT_SEPARATION_DONE')
