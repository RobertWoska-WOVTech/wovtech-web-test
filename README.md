# WOV Tech multilingual static website

Source-of-truth language: Slovak (`sk`)

Languages:
- `sk` (default)
- `cs`
- `en`

## Build
```bash
npm run build
```

The build script generates:
- `/dist/*.html` for Slovak
- `/dist/cs/**/*.html` for Czech
- `/dist/en/**/*.html` for English
- `sitemap.xml`
- `hreflang` links
- localized canonical / OG / JSON-LD tags

## Notes
- Brand names and technical abbreviations are intentionally not translated.
- Legal pages are localized for the target language, but the Slovak legal/contractual framework remains decisive unless agreed otherwise.
- Placeholder images are included in `assets/img/` and can be replaced with production assets.
