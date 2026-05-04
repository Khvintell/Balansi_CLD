from PIL import Image
import os

base_path = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\assets\images'
input_path = os.path.join(base_path, 'icon.png')

img = Image.open(input_path)
w, h = img.size
print(f"Dimensions: {w}x{h}")

# Get dominant background color (top-left pixel)
bg_color = img.getpixel((10, 10))
print(f"Suggested BG Color: {bg_color}")
