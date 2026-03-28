# Wingman Logo & PWA Icon Setup

## Files Updated ✅
- ✅ `index.html` — Added favicon, Open Graph, and PWA meta tags
- ✅ `manifest.json` — Updated to use PNG icons with proper configuration

## Next: Resize & Add Logo Assets

### You have two logo files:
1. **wingman_logo_app.png** — Square icon (192×192+) with dark rounded background
2. **Wingman_logo_design_concept.png** — Horizontal logo (for OG preview)

### Step 1: Install ImageMagick (if not installed)
```bash
brew install imagemagick
```

### Step 2: Resize Images to Public Folder
Run these commands from your project root:

```bash
# Ensure icons directory exists
mkdir -p public/icons

# Create app icons from wingman_logo_app.png
magick wingman_logo_app.png -resize 512x512 public/icons/icon-512.png
magick wingman_logo_app.png -resize 192x192 public/icons/icon-192.png
magick wingman_logo_app.png -resize 180x180 public/icons/apple-touch.png
magick wingman_logo_app.png -resize 32x32 public/favicon.ico

# Create OG preview image from Wingman_logo_design_concept.png
magick Wingman_logo_design_concept.png -resize 1200x630 public/og-image.png
```

### Step 3: Verify Files Created
```bash
ls -la public/icons/
ls -la public/*.ico public/*.png
```

You should see:
```
public/icons/icon-512.png
public/icons/icon-192.png
public/icons/apple-touch.png
public/favicon.ico
public/og-image.png
```

### Step 4: Deploy & Test

**Deploy:**
```bash
firebase deploy --only hosting
```

**Test OG Link Preview:**
- Use: https://www.opengraph.xyz/
- Enter: https://wingman-pwa.web.app
- Should show app title, description, and logo

**Test PWA Install:**
- iPhone: Safari → Share → Add to Home Screen
- Android: Chrome → Menu → Install app
- Should show Wingman icon on home screen

**Test Favicon:**
- Refresh browser tab
- Should see Wingman icon next to title

---

## What These Files Do

| File | Size | Purpose |
|------|------|---------|
| `icon-512.png` | 512×512 | High-res PWA icon (Android splash screen, store listings) |
| `icon-192.png` | 192×192 | Standard PWA home screen icon |
| `apple-touch.png` | 180×180 | iPhone home screen icon (Apple specific) |
| `favicon.ico` | 32×32 | Browser tab icon |
| `og-image.png` | 1200×630 | Link preview in iMessage, Instagram DMs, Slack |

---

## After Setup

Once files are in place:
1. Run `firebase deploy --only hosting`
2. Commit: `git add -A && git commit -m "Add Wingman logo assets and PWA configuration"`
3. Test all the verification points above

---

## Important Notes

- ✅ The background of `wingman_logo_app.png` is already dark — perfect for PWA
- ✅ Android will use `"purpose": "maskable"` so the icon won't be clipped
- ✅ `theme_color: "#c9a84c"` (gold) will tint Android browser chrome
- ✅ `og-image.png` shows up when users share the link on Instagram, iMessage, etc.

The entire PWA + link sharing experience is now branded with your logo! 🎉
