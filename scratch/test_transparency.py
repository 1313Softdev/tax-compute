from PIL import Image, ImageDraw

def remove_background(img_path, save_path):
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    
    # Create a mask for flood fill
    # Step 1: Make black pixels near the corners transparent
    # We can flood fill black from (0,0), (w-1,0), (0,h-1), (w-1,h-1)
    # The black color is (0, 0, 0, 255)
    # Let's do a flood fill of the black area to transparent
    # PIL doesn't have direct transparent floodfill, but we can do it by finding connected components or using ImageDraw.floodfill
    
    # We'll use a copy of the image to perform flood fills
    data = img.load()
    
    # First, let's define a helper for flood fill that sets alpha to 0
    # We will use ImageDraw.floodfill to fill with (0,0,0,0)
    # For black corners, we start at the 4 corners: (0,0), (w-1, 0), (0, h-1), (w-1, h-1)
    # Since the black corners might have slight compression noise, we use a tolerance or simple color matching.
    # Actually, we can write a custom flood-fill in Python for precise tolerance.
    
    visited = set()
    
    def flood_fill_alpha_zero(start_x, start_y, target_color_check_fn):
        if (start_x, start_y) in visited:
            return
        
        # Simple BFS/DFS flood fill
        queue = [(start_x, start_y)]
        visited.add((start_x, start_y))
        
        while queue:
            cx, cy = queue.pop(0)
            
            # Make transparent
            r, g, b, a = data[cx, cy]
            data[cx, cy] = (r, g, b, 0)
            
            # Check neighbors
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < w and 0 <= ny < h:
                    if (nx, ny) not in visited:
                        nr, ng, nb, na = data[nx, ny]
                        if target_color_check_fn(nr, ng, nb, na):
                            visited.add((nx, ny))
                            queue.append((nx, ny))
                            
    # Target check for black corners: R, G, B all < 40
    def is_black_corner(r, g, b, a):
        return r < 40 and g < 40 and b < 40
    
    # Run flood fill for black corners
    print("Flooding black corners...")
    for sx, sy in [(0,0), (w-1, 0), (0, h-1), (w-1, h-1)]:
        if is_black_corner(*data[sx, sy]):
            flood_fill_alpha_zero(sx, sy, is_black_corner)
            
    # Step 2: Flood fill the outer white card background.
    # The white card background starts near the edges, e.g. at (100, 100) or any pixel that is white on the outer part of the card.
    # Let's scan along the top border to find the first white pixel.
    # Since we made black corners transparent, we can find a white pixel that is adjacent to the transparent areas.
    # Let's target any white pixel (R, G, B > 230) on the outer edge
    def is_white_background(r, g, b, a):
        # We also want to include slightly off-white and shadows (e.g. down to 220) to clear the card background cleanly
        return r > 210 and g > 210 and b > 210
    
    # Let's find white pixels near the outer boundary (e.g. x=100, y=100 is inside the white card)
    # We flood fill from (100, 100)
    print("Flooding white background from (100, 100)...")
    if is_white_background(*data[100, 100]):
        flood_fill_alpha_zero(100, 100, is_white_background)
        
    img.save(save_path, "PNG")
    print(f"Saved processed image to {save_path}")

# Run background removal
remove_background(
    '/Users/kuku/Downloads/tax-compu/web/public/logo.png',
    '/Users/kuku/Downloads/tax-compu/scratch/logo_transparent.png'
)

# Render ASCII preview of the processed image
img_trans = Image.open('/Users/kuku/Downloads/tax-compu/scratch/logo_transparent.png')
img_small = img_trans.resize((60, 40), Image.Resampling.NEAREST)
for y in range(40):
    line = []
    for x in range(60):
        r, g, b, a = img_small.getpixel((x, y))
        if a == 0:
            line.append('.')  # transparent
        elif r >= 220 and g >= 220 and b >= 220:
            line.append(' ')  # white/light
        else:
            line.append('#')  # color
    print("".join(line))
