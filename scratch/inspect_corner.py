from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png')

# Print colors in a 20x20 window around x=290, y=180
# Let's print the colors as text: '.' for white/near-white, '#' for dark/colored
for y in range(165, 195):
    line = []
    for x in range(275, 305):
        r, g, b, a = img.getpixel((x, y))
        is_white = (r > 240 and g > 240 and b > 240)
        if is_white:
            line.append('.')
        else:
            line.append('#')
    print(f"y={y:03d}: {''.join(line)}")
