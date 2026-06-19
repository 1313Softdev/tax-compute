from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png')
print("Original color at (350, 250):", img.getpixel((350, 250)))
print("Original color at (400, 250):", img.getpixel((400, 250)))
print("Original color at (450, 250):", img.getpixel((450, 250)))
