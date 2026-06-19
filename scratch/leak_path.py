from PIL import Image

img = Image.open('/Users/kuku/Downloads/tax-compu/web/public/logo.png').convert("RGBA")
w, h = img.size
data = img.load()

# Run a pathfinding algorithm to see if we can go from (100, 100) to (350, 250)
# using only white pixels (R, G, B > 210)
queue = [(100, 100)]
visited = set(queue)
path = {}

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
                    queue.append((nx, ny))
                    path[(nx, ny)] = (cx, cy)

if found:
    print("Found a white pixel path from (100, 100) to (350, 250)!")
    # Let's print a sample of the path coordinates
    curr = (350, 250)
    steps = []
    while curr != (100, 100):
        steps.append(curr)
        curr = path[curr]
    steps.append((100, 100))
    steps.reverse()
    print("Path length:", len(steps))
    print("Path sample:", steps[:10], "...", steps[-10:])
else:
    print("No white pixel path found (it is isolated).")
