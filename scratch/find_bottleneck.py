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

# For each step of the path, calculate its distance to the nearest non-white pixel
# (to find the bottleneck where it squeezes through a gap)
print("Analyzing bottleneck along the path...")
bottlenecks = []
for idx, (px, py) in enumerate(path):
    # Find distance to nearest non-white pixel (R, G, B <= 210)
    min_dist = 9999
    nearest_p = None
    # Look in a local 30x30 window
    for dy in range(-15, 16):
        for dx in range(-15, 16):
            nx, ny = px + dx, py + dy
            if 0 <= nx < w and 0 <= ny < h:
                r, g, b, a = data[nx, ny]
                if not (r > 210 and g > 210 and b > 210):
                    dist = (dx*dx + dy*dy)**0.5
                    if dist < min_dist:
                        min_dist = dist
                        nearest_p = (nx, ny)
    bottlenecks.append((px, py, min_dist, nearest_p))

# Sort by distance to find the tightest bottlenecks
# (ignoring steps near the start/end if they are naturally close to elements)
bottlenecks_sorted = sorted(bottlenecks, key=lambda x: x[2])
print("\nTightest bottlenecks (smallest distance to a colored pixel):")
for b in bottlenecks_sorted[:10]:
    print(f"  Pixel {b[0]} is {b[2]:.2f}px away from colored pixel {b[3]}")
