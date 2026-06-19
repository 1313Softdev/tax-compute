from PIL import Image

img = Image.open('/Users/kuku/.gemini/antigravity/brain/8767fa43-eefa-4aea-9acd-ca26eb18ad03/screencap_v6.png')
w, h = img.size

red_pixels = 0
total_pixels = w * h

for y in range(h):
    for x in range(w):
        r, g, b = img.getpixel((x, y))[:3]
        # In a red error screen, R is very high and G/B are low
        if r > 180 and g < 40 and b < 40:
            red_pixels += 1

red_ratio = red_pixels / total_pixels
print(f"Red pixels ratio: {red_ratio:.2%}")
if red_ratio > 0.5:
    print("The screen is mostly RED (error is likely still present).")
else:
    print("The screen is NOT mostly red (the app likely loaded successfully!)")
