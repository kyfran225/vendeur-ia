from PIL import Image
import os

source_path = r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public\logo-1024x1024.png'
target_path = r'C:\Users\Franck\web-apps\vendeur-ia\apps\web\public\logo-150x150.png'

if not os.path.exists(source_path):
    # Fallback to the root image if public one doesn't exist
    source_path = r'C:\Users\Franck\web-apps\vendeur-ia\Code_Generated_Image (1).png'

try:
    img = Image.open(source_path)
    # Resize to 150x150 using LANCZOS for high quality
    resized_img = img.resize((150, 150), Image.Resampling.LANCZOS)
    resized_img.save(target_path)
    print(f"Logo generated successfully at {target_path}")
except Exception as e:
    print(f"Error: {e}")
