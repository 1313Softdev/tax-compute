from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png')
w, h = img.size

# Let's print the colors of some pixels on the top row y = 0
print("Top row (y=0) colors:")
for x in range(0, w, w // 10):
    print(f"  x={x}: {img.getpixel((x, 0))}")

print("\nSecond row (y=1) colors:")
for x in range(0, w, w // 10):
    print(f"  x={x}: {img.getpixel((x, 1))}")
