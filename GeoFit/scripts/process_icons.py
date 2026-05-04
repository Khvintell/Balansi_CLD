from PIL import Image, ImageOps
import os

base_path = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\assets\images'
input_path = os.path.join(base_path, 'icon.png')

# 1. Standard icon.png (1024x1024)
img = Image.open(input_path)
img = img.convert('RGBA')
icon = img.resize((1024, 1024), Image.Resampling.LANCZOS)
icon.save(os.path.join(base_path, 'icon_new.png'))

# 2. Adaptive Icon (Foreground)
# We want the icon to be smaller inside the frame to avoid cropping
adaptive_size = 1024
content_size = int(adaptive_size * 0.65) # 65% of frame
content = img.resize((content_size, content_size), Image.Resampling.LANCZOS)

adaptive = Image.new('RGBA', (adaptive_size, adaptive_size), (0, 0, 0, 0))
offset = (adaptive_size - content_size) // 2
adaptive.paste(content, (offset, offset), content)
adaptive.save(os.path.join(base_path, 'adaptive-icon.png'))

# 3. Splash Icon (Centered)
splash = Image.new('RGBA', (2000, 2000), (0, 0, 0, 0))
splash_content_size = 800
splash_content = img.resize((splash_content_size, splash_content_size), Image.Resampling.LANCZOS)
s_offset = (2000 - splash_content_size) // 2
splash.paste(splash_content, (s_offset, s_offset), splash_content)
splash.save(os.path.join(base_path, 'splash-icon.png'))

# 4. Favicon
fav = img.resize((48, 48), Image.Resampling.LANCZOS)
fav.save(os.path.join(base_path, 'favicon.png'))

# Replace old icon.png with resized one
os.replace(os.path.join(base_path, 'icon_new.png'), input_path)

print("Icons processed successfully!")
