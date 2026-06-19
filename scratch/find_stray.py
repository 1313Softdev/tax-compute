from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/scratch/logo_transparent.png')
w, h = img.size

# Find all pixels with alpha > 0 that are very far from the center logo elements
# The logo elements seem to be in the center, say between y = 150 and y = 900, and x = 150 and x = 900.
# Let's search for any non-transparent pixel in the outer margin (e.g. outer 100 pixels)

stray_pixels = []
for y in range(h):
    for x in range(w):
        r, g, b, a = img.getpixel((x, y))
        if a > 0:
            # Check if it's in the outer border area (within 120 pixels of the edge)
            # but wait, the logo might touch the top/bottom?
            # Let's just list pixels that have a > 0 and are near the top (y < 120) or corners
            if y < 120 or y > h - 120 or x < 120 or x > w - 120:
                # Let's check if it is part of the actual graphic or just a stray pixel
                # Let's print details of such pixels
                stray_pixels.append((x, y, (r, g, b, a)))

print(f"Total non-transparent pixels in outer margins: {len(stray_pixels)}")
if stray_pixels:
    print("Sample stray pixels (first 20):")
    for p in stray_pixels[:20]:
        print(p)
