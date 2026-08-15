import re

with open(r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public\logo.svg', 'r', encoding='utf-8') as f:
    content = f.read()

paths = re.findall(r'd="(.*?)"', content)
print(f'Paths count: {len(paths)}')

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
      viewBox="0 0 1254 1254"
      width={{size}}
      height={{size}}
      className={{cn("shrink-0 transition-colors duration-200", className)}}
      {{...props}}
    >
      <g>
        {{/* Branche Gauche (Oblique V) */}}
        <path fill={{leftBranchColor}} d="{paths[0]}" />
        {{/* Branche Droite (Forme 7 / Accent) */}}
        <path fill={{rightBranchColor}} d="{paths[1]}" />
      </g>
    </svg>
  );
}};
'''

with open(r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\src\components\ui\Logo.tsx', 'w', encoding='utf-8') as f:
    f.write(tsx_content)

print('LOGO_TSX_SUCCESSFULLY_UPDATED')
