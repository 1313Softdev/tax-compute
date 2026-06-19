from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png')
w, h = img.size

# Scan vertically at x = 330 for y from 200 to 500
print("Vertical scan at x = 330:")
for y in range(200, 500, 10):
    r, g, b, a = img.getpixel((330, y))
    is_white = (r > 210 and g > 210 and b > 210)
    print(f"  y={y}: color={img.getpixel((330, y))[:3]} {'(white)' if is_white else '(COLORED)'}")
