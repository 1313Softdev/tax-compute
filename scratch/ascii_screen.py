from PIL import Image

img = Image.open('/Users/kuku/.gemini/antigravity/brain/8767fa43-eefa-4aea-9acd-ca26eb18ad03/screencap_v6.png')
# Resize to 60x60
img_small = img.resize((60, 40), Image.Resampling.NEAREST)

for y in range(40):
    line = []
    for x in range(60):
        r, g, b = img_small.getpixel((x, y))[:3]
        # Calculate brightness
        brightness = (r + g + b) / 3
        # If very dark
        if brightness < 40:
            line.append('.')
        # If very light
        elif brightness > 210:
            line.append(' ')
        else:
            line.append('#')
    print("".join(line))
