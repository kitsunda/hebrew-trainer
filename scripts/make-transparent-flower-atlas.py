from pathlib import Path
from statistics import median
from PIL import Image

source_path = Path(__file__).resolve().parents[1] / 'icons' / 'achievement-flowers.png'
target_path = Path(__file__).resolve().parents[1] / 'icons' / 'achievement-flowers-transparent.png'

image = Image.open(source_path).convert('RGBA')
width, height = image.size
cell_width, cell_height = width / 10, height / 5
pixels = image.load()
output = Image.new('RGBA', image.size, (0, 0, 0, 0))
out_pixels = output.load()

for row in range(5):
    for col in range(10):
        x0, y0 = round(col * cell_width), round(row * cell_height)
        x1, y1 = round((col + 1) * cell_width), round((row + 1) * cell_height)
        border = []
        for x in range(x0 + 8, x1 - 8, 8):
            border.extend((pixels[x, y0 + 8][:3], pixels[x, y1 - 9][:3]))
        for y in range(y0 + 8, y1 - 8, 8):
            border.extend((pixels[x0 + 8, y][:3], pixels[x1 - 9, y][:3]))
        background = tuple(round(median(channel)) for channel in zip(*border))

        for y in range(y0, y1):
            for x in range(x0, x1):
                r, g, b, _ = pixels[x, y]
                distance = ((r - background[0]) ** 2 + (g - background[1]) ** 2 + (b - background[2]) ** 2) ** 0.5
                alpha = max(0, min(255, round((distance - 24) * 18)))
                local_x, local_y = x - x0, y - y0
                if (local_x < 38 and local_y < 34) or local_y > 184:
                    alpha = 0
                out_pixels[x, y] = (r, g, b, alpha)

output.save(target_path, optimize=True)
print(f'Created {target_path}')
