# Assets

## Brand kit (Playbook, shared by Tara on 11 Sep 2026)

https://www.playbook.com/s/itsalishadesigns/DHfKv6rTtQv4inWqSsf28nSc

Folders on the board: Logos (Print Logo, Digital Logo), Colors, Fonts (Proxima Nova, Great Vibes, Cormorant Garamond), Watermark (PNG, PDF), Brand Assets (print and digital documents), Brand Guidelines, Brand Presentation, Brand Strategy.

Dan downloads from the board and drops into assets/brand/:
- Digital Logo folder (all files) into assets/brand/logo/
- Brand Guidelines PDF into assets/brand/guidelines.pdf
- Watermark PNG into assets/brand/watermark.png

Rudrika is a registered trademark. The TM mark sits next to the logo wherever the logo appears. If a logo file already carries the TM, use that file; if not, add a superscript TM after the wordmark in code and never crop it off.

Until the Playbook files are in the folder, the current site's logo files are:
- Light logo on transparent (for the maroon header band and footer): https://rudrika.in/cdn/shop/files/RUDRIKA_LOGO_UPSCALED_TM_TRANS.png (the file name suggests the TM is included; check it)
- Square dark logo 2000 x 2000: https://rudrika.in/cdn/shop/files/RUDRIKA_LOGO_UPSCALED.png
- Favicon: https://rudrika.in/cdn/shop/files/RUDRIKA_LOGO_UPSCALED_TM_TRANS.png?width=32

Brand colours from the kit: Soft Ivory #fff7f0, Warm Gold #c4a580 (primary); Deep Maroon #471113, Midnight Blue #0e0f1e (secondary); Sunset Orange #f47631, Terracotta Flame #f26422, Heritage Red #d44827 (accents).

## Campaign photos (assets/photos/, 28 files, from Tara's WhatsApp archive of 10 Sep 2026)

Studio shots of one model in Kanjivaram and Banarasi style silks (orange with gold zari, teal with zari border, ivory tissue, magenta with gold border, yellow, purple) against green, red and pink backdrops with a mandala light pattern. WhatsApp-compressed (1280 px longest edge), fine for web at up to 1280 px; ask Tara for the originals if a hero needs to be larger than 1600 px wide.

Contact sheet: assets/photos/contact-sheet.jpg

Suggested uses (by file number):
- Hero, desktop landscape with motion: 09 (purple pallu flying, green backdrop), 14 (red pallu across the frame, wide), 11 (yellow drape in motion), 28 (purple drape, green backdrop), 02 (yellow motion, pink backdrop)
- Hero, mobile portrait: 03, 10, 15, 26
- Collection and category tiles (portrait, full figure): 01, 16, 22, 25, 27 (orange and teal silks), 05, 17 (ivory tissue), 19, 23
- Detail and texture crops (zari borders, jewellery): 06, 08, 13, 18
- Editorial blocks, about, styling page, blog covers (landscape): 04, 07, 12, 20, 21, 24

Orientation: portrait 853 x 1280 (01, 03, 05, 06, 07, 10, 15, 16, 17, 18, 19, 22, 23, 25, 26, 27), landscape 1280 x 853 (02, 04, 09, 11, 12, 14, 20, 28), wide 1280 x 720 (08, 13, 21, 24).

## Product images

All 56 products keep their images from the current site as CDN URLs in data/DATA.json (up to six per product, 257 images). scripts/fetch-rudrika-images.js in the build plan downloads them; do this before the Shopify store is closed or the links die.

## Other brand media on the current site (for reference, downloadable while Shopify is live)

- Hero video: see data/content.json brand.hero_video (MP4, 1080p)
- Section images: brand.image_exclusive, brand.image_footer, brand.image_products_banner, brand.image_teera
- Collection covers: collections[].image, relative to https://rudrika.in/cdn/shop/
