from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png')
w, h = img.size

# Let's count pixels of different colors
black_count = 0
white_count = 0  # near white: r, g, b all >= 250
other_count = 0

for y in range(h):
    for x in range(w):
        r, g, b, a = img.getpixel((x, y))
        if r < 10 and g < 10 and b < 10:
            black_count += 1
        elif r >= 250 and g >= 250 and b >= 250:
            white_count += 1
        else:
            other_count += 1

total = w * h
print(f"Total pixels: {total}")
print(f"Black pixels (approx): {black_count} ({black_count/total:.2%})")
print(f"White pixels (approx): {white_count} ({white_count/total:.2%})")
print(f"Other pixels (approx): {other_count} ({other_count/total:.2%})")

# Let's check if the outer border is completely black
# Let's check the pixel color at (x, 0), (x, h-1), (0, y), (w-1, y)
border_colors = set()
for x in range(w):
    border_colors.add(img.getpixel((x, 0))[:3])
    border_colors.add(img.getpixel((x, h-1))[:3])
for y in range(h):
    border_colors.add(img.getpixel((0, y))[:3])
    border_colors.add(img.getpixel((w-1, y))[:3])

print("Unique border colors:", list(border_colors)[:10])
