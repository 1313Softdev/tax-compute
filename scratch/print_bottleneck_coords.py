from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png').convert("RGBA")
w, h = img.size
data = img.load()

# Re-run BFS path finding
queue = [(100, 100)]
visited = { (100, 100) }
parent = {}

found = False
while queue:
    cx, cy = queue.pop(0)
    if (cx, cy) == (350, 250):
        found = True
        break
        
    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
        nx, ny = cx + dx, cy + dy
        if 0 <= nx < w and 0 <= ny < h:
            if (nx, ny) not in visited:
                r, g, b, a = data[nx, ny]
                if r > 210 and g > 210 and b > 210:
                    visited.add((nx, ny))
                    parent[(nx, ny)] = (cx, cy)
                    queue.append((nx, ny))

if not found:
    print("No path found.")
    exit()

# Reconstruct the path from (100, 100) to (350, 250)
curr = (350, 250)
path = []
while curr != (100, 100):
    path.append(curr)
    curr = parent[curr]
path.append((100, 100))
path.reverse()

# Print bottleneck coordinates
for idx in range(280, 295):
    print(f"Path step {idx}: Coordinate={path[idx]}, pixel color={data[path[idx]]}")
