# アイコン生成

[icon.svg](./icon.svg) から PNG を生成してください:

```bash
# rsvg-convertで生成
rsvg-convert -w 192 -h 192 public/icon.svg -o public/icon-192.png
rsvg-convert -w 512 -h 512 public/icon.svg -o public/icon-512.png

# または ImageMagick
magick -background none public/icon.svg -resize 192x192 public/icon-192.png
magick -background none public/icon.svg -resize 512x512 public/icon-512.png
```

本番ではMOAIロゴ（`projects/moai/moai_logo.png`）を使って差し替えるのが望ましい。
