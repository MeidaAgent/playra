from PIL import Image

im = Image.open('src/assets/brand/plank_logo.jpg')
print('src/assets/brand/plank_logo.jpg size:', im.size)

# Also let's search user uploads for the original logo
import glob
for f in glob.glob(r'C:\Users\ArourL\.gemini\antigravity-ide\brain\286b5211-54b5-4ede-b74d-344473b58a53\**\*plank*', recursive=True):
    print(f)
