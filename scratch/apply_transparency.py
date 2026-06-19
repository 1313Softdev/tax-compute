from PIL import Image

def make_logo_transparent(src_path, logo_dest, icon_dest):
    img = Image.open(src_path).convert("RGBA")
    w, h = img.size
    data = img.load()
    
    visited = set()
    
    # Flood fill helper
    def flood_fill(start_x, start_y, match_fn):
        if (start_x, start_y) in visited:
            return
        queue = [(start_x, start_y)]
        visited.add((start_x, start_y))
        
        while queue:
            cx, cy = queue.pop(0)
            data[cx, cy] = (0, 0, 0, 0)  # Make pixel transparent
            
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < w and 0 <= ny < h:
                    if (nx, ny) not in visited:
                        r, g, b, a = data[nx, ny]
                        if match_fn(r, g, b, a):
                            visited.add((nx, ny))
                            queue.append((nx, ny))

    # 1. Flood fill black corners + drop shadow
    # Distance tolerance 160 from black (0, 0, 0)
    def matches_black(r, g, b, a):
        dist = (r*r + g*g + b*b) ** 0.5
        return dist <= 160 and a > 0

    for sx, sy in [(0,0), (w-1, 0), (0, h-1), (w-1, h-1)]:
        if matches_black(*data[sx, sy]):
            flood_fill(sx, sy, matches_black)
            
    # 2. Flood fill white background card
    # Start color at (100, 100) is (253, 254, 254)
    # Distance tolerance 80 from that color
    start_r, start_g, start_b, start_a = 253, 254, 254, 255
    
    def matches_white(r, g, b, a):
        if a == 0:
            return False
        dist = ((r - start_r)**2 + (g - start_g)**2 + (b - start_b)**2) ** 0.5
        return dist <= 80

    if matches_white(*data[100, 100]):
        flood_fill(100, 100, matches_white)
        
    # Save to logo destination
    img.save(logo_dest, "PNG")
    print(f"Successfully saved transparent logo to {logo_dest}")
    
    # Save to icon destination
    img.save(icon_dest, "PNG")
    print(f"Successfully saved transparent favicon to {icon_dest}")

# Run the transformation using the original logo as source
# (since the original logo currently at public/logo.png has the white card and black corners)
make_logo_transparent(
    '/Users/kuku/Downloads/tax-compu/web/public/logo.png',
    '/Users/kuku/Downloads/tax-compu/web/public/logo.png',
    '/Users/kuku/Downloads/tax-compu/web/src/app/icon.png'
)
