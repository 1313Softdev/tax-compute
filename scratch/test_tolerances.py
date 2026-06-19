from PIL import Image

def test_flood_fill(black_tolerance, white_tolerance):
    img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png').convert("RGBA")
    w, h = img.size
    data = img.load()
    
    visited = set()
    
    def flood_fill(start_x, start_y, match_fn):
        if (start_x, start_y) in visited:
            return
        queue = [(start_x, start_y)]
        visited.add((start_x, start_y))
        
        while queue:
            cx, cy = queue.pop(0)
            data[cx, cy] = (0, 0, 0, 0)  # transparent
            
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < w and 0 <= ny < h:
                    if (nx, ny) not in visited:
                        r, g, b, a = data[nx, ny]
                        if match_fn(r, g, b, a):
                            visited.add((nx, ny))
                            queue.append((nx, ny))

    # Flood fill black corners + drop shadow
    # Starting color is black (0, 0, 0)
    # Match any pixel whose color distance from black is within black_tolerance
    def matches_black(r, g, b, a):
        # Euclidean distance in RGB
        dist = (r*r + g*g + b*b) ** 0.5
        return dist <= black_tolerance and a > 0

    print(f"Flooding black corners with tolerance {black_tolerance}...")
    for sx, sy in [(0,0), (w-1, 0), (0, h-1), (w-1, h-1)]:
        if matches_black(*data[sx, sy]):
            flood_fill(sx, sy, matches_black)
            
    # Flood fill white card
    # Starting color at (100, 100) is (253, 254, 254)
    # Match any pixel whose color distance from (253, 254, 254) is within white_tolerance
    start_r, start_g, start_b, start_a = data[100, 100]
    
    def matches_white(r, g, b, a):
        if a == 0:
            return False
        # Distance from the start white color
        dist = ((r - start_r)**2 + (g - start_g)**2 + (b - start_b)**2) ** 0.5
        return dist <= white_tolerance

    print(f"Flooding white card with tolerance {white_tolerance}...")
    if matches_white(*data[100, 100]):
        flood_fill(100, 100, matches_white)
        
    save_path = f"/Users/kuku/Downloads/tax-compu/scratch/logo_trans_t{black_tolerance}_w{white_tolerance}.png"
    img.save(save_path, "PNG")
    print(f"Saved to {save_path}")
    
    # ASCII Preview
    img_trans = Image.open(save_path)
    img_small = img_trans.resize((60, 40), Image.Resampling.NEAREST)
    print("ASCII PREVIEW:")
    for y in range(40):
        line = []
        for x in range(60):
            r, g, b, a = img_small.getpixel((x, y))
            if a == 0:
                line.append('.')
            elif r >= 220 and g >= 220 and b >= 220:
                line.append(' ')
            else:
                line.append('#')
        print("".join(line))

# Run tests
test_flood_fill(160, 80)
