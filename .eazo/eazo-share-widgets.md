# Kintsugi — Heal in Gold: Share Widget Spec

## App Identity
- **Name:** Kintsugi — Heal in Gold
- **Colors:** Ink dark `#221E1D`, Gold `#C9A961`, Cream `#F5F0E8`, Shadow grey `#8A8580`, Rose `#D4847A`
- **Typography:** Cormorant Garamond (serif, italic) for headings; Inter for body
- **Visual motif:** A ceramic vessel with gilded cracks (SVG lines, organic fractures)

## Share Scenarios

### 1. Gold Vein Saved (from AI chat)
Triggered when user saves a reframe as a gold vein.

**Share payload:**
```
User saved a gold vein to their Kintsugi vessel.

Gold vein: "[goldVeinText]"

Original fracture: "[narrativeText excerpt, 80 chars max]"
```

**Widget composition:**
- Dark ink background (`#221E1D`)
- Small ceramic vessel SVG in top-right, 60x80px, with 1–3 animated gold crack lines
- Gold dot accent top-left (`#C9A961`, 6px, glowing)
- Heading in Cormorant Garamond italic: `"[goldVeinText]"` — up to 3 lines
- Caption in Inter 11px: `A fracture gilded.` in shadow grey
- Kintsugi wordmark bottom-left in gold, small caps

### 2. Exercise Completed
Triggered when user completes a Gilding Station exercise.

**Share payload:**
```
Just completed "[exerciseTitle]" at the Kintsugi Gilding Station.

The practice: [completionNarrative]
```

**Widget composition:**
- Same dark ink background
- Exercise phase label top: `Phase I — III` etc., in gold 9px uppercase
- Exercise title in Cormorant Garamond italic, large
- Gold thread progress strip below title (full width, 1px height, solid gold)
- "Gilding Station" label bottom in Inter 10px shadow grey
- Kintsugi wordmark bottom-left

## Design Notes
- Never use celebratory language ("Congratulations!" / "You did it!")
- Tone: dignified, reflective, unhurried — like a craft colophon
- Gold cracks should appear to shimmer gently if animation is supported
- No user avatars, no names, no timestamps shown in the widget
- Widget should feel like a page from an artisan's journal
