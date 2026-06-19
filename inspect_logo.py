from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png')
print("Format:", img.format)
print("Size:", img.size)
print("Mode:", img.mode)

# Print colors at corners and center
w, h = img.size
print("Top-left pixel (0,0):", img.getpixel((0, 0)))
print("Top-right pixel (w-1,0):", img.getpixel((w-1, 0)))
print("Center pixel (w//2, h//2):", img.getpixel((w//2, h//2)))
print("Pixel at (10, 10):", img.getpixel((10, 10)))
print("Pixel at (100, 100):", img.getpixel((100, 100)))
