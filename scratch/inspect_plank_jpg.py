from PIL import Image

im = Image.open('src/assets/brand/plank_logo.jpg')
print('Mode:', im.mode)
# Save a small version to scratch to inspect
im.resize((346, 122)).save('scratch/plank_small.png')
print('Saved plank_small.png')
