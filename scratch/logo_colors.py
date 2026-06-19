from PIL import Image
from collections import Counter

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png')
w, h = img.size

# Let's count colors by rounding them to the nearest multiple of 16 to group similar colors
color_counter = Counter()

for y in range(h):
    for x in range(w):
        r, g, b, a = img.getpixel((x, y))
        # Skip black/white/gray
        is_black = (r < 30 and g < 30 and b < 30)
        is_white = (r > 240 and g > 240 and b > 240)
        is_gray = (abs(r - g) < 15 and abs(g - b) < 15 and abs(r - b) < 15 and r > 100 and r < 240)
        
        if not (is_black or is_white or is_gray):
            # Round to nearest 16 to cluster
            rounded_color = (r // 16 * 16, g // 16 * 16, b // 16 * 16)
            color_counter[rounded_color] += 1

print("Top 10 most common colorful clusters:")
for color, count in color_counter.most_common(10):
    print(f"  Color {color}: {count} pixels")
