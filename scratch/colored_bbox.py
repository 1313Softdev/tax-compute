from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png')
w, h = img.size

min_x, min_y, max_x, max_y = w, h, 0, 0
colored_pixels = 0

for y in range(h):
    for x in range(w):
        r, g, b, a = img.getpixel((x, y))
        # If it is not black and not white
        is_black = (r < 10 and g < 10 and b < 10)
        is_white = (r >= 250 and g >= 250 and b >= 250)
        if not is_black and not is_white:
            colored_pixels += 1
            if x < min_x: min_x = x
            if y < min_y: min_y = y
            if x > max_x: max_x = x
            if y > max_y: max_y = y

print(f"Colored pixels: {colored_pixels}")
print(f"Bounding box of colored pixels: X: [{min_x}, {max_x}], Y: [{min_y}, {max_y}]")
