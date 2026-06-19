from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png')
img_trans = Image.open('/Users/kuku/Downloads/tax-compu/scratch/logo_transparent.png')

# Let's inspect a 10x10 block around (921, 51)
print("Original logo around (921, 51):")
for y in range(45, 55):
    row_orig = []
    row_trans = []
    for x in range(915, 927):
        p_orig = img.getpixel((x, y))
        p_trans = img_trans.getpixel((x, y))
        # Represent original: K (black), W (white), C (colored)
        # Represent trans: T (transparent), W (white), C (colored)
        
        # Original
        if p_orig[0] < 40 and p_orig[1] < 40 and p_orig[2] < 40:
            row_orig.append('K')
        elif p_orig[0] >= 220 and p_orig[1] >= 220 and p_orig[2] >= 220:
            row_orig.append('W')
        else:
            row_orig.append('C')
            
        # Trans
        if p_trans[3] == 0:
            row_trans.append('T')
        elif p_trans[0] >= 220 and p_trans[1] >= 220 and p_trans[2] >= 220:
            row_trans.append('W')
        else:
            row_trans.append('C')
            
    print(f"y={y:02d}: Orig={''.join(row_orig)} | Trans={''.join(row_trans)}")
