from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png')
# Downsample to 60x60 using nearest-neighbor or bilinear
img_small = img.resize((60, 40), Image.Resampling.BILINEAR)

for y in range(40):
    line = []
    for x in range(60):
        r, g, b, a = img_small.getpixel((x, y))
        is_black = (r < 40 and g < 40 and b < 40)
        is_white = (r >= 220 and g >= 220 and b >= 220)
        if is_black:
            line.append('.')
        elif is_white:
            line.append(' ')
        else:
            line.append('#')
    print("".join(line))
