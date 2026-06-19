from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png')
w, h = img.size

# Sample pixels horizontally along the middle row
mid_y = h // 2
colors_mid_y = [img.getpixel((x, mid_y)) for x in range(0, w, w // 10)]
print("Middle row samples (x from 0 to w):")
for i, c in enumerate(colors_mid_y):
    print(f"  x={i * (w // 10)}: {c}")

# Scan along the diagonal from top-left (0,0) to center (w//2, h//2)
print("\nDiagonal samples from (0,0) to center:")
for i in range(0, w // 2, w // 20):
    print(f"  ({i}, {i}): {img.getpixel((i, i))}")
