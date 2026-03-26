# PDF Layout Structure

## Header Layout (Top Section)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  [LOGO]              COMPANY NAME                  KOSZTORYS OFERTOWY  │
│                      Address Line 1                Data: 17.01.2026    │
│                      Address Line 2                                     │
│                      NIP: XXX | REGON: YYY         NABYWCA / INWESTOR: │
│                      Email: ... | Tel: ...         Jan Kowalski         │
│                                                     ul. Kwiatowa 15     │
│                                                     NIP: 123-456-78-90  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  PROJEKT: Mieszkanie ul. Słoneczna 10                                  │
│  Region: Mazowieckie                                                    │
│  Typ obiektu: Mieszkanie / Dom                                          │
│                                                                         │
│                                             LEGENDA KOLORÓW:            │
│                                             Pomarańczowy - Zestaw       │
│                                             Niebieski - Pojedyncza      │
│                                             Żółty -> Materiał           │
│                                             Zielony -> Robocizna        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Header Components

### Left Side (Company Data)
1. **Logo** (if provided)
   - Position: Top-left (14mm from left, 15mm from top)
   - Size: 30mm × 30mm (fixed square)
   - Format: PNG/JPG

2. **Company Details**
   - Company Name (bold, blue if colors enabled)
   - Address (multi-line support, max 70mm width)
   - NIP & REGON (combined on one line with "|" separator)
   - Email & Phone (combined on one line with "|" separator)

### Right Side (Document & Client Data)
1. **Document Title**
   - "KOSZTORYS OFERTOWY" (bold, blue if colors enabled)
   - Font size: 14pt
   - Position: Top-right (196mm from left, 20mm from top)

2. **Date**
   - Format: DD.MM.YYYY (Polish locale)
   - Font size: 10pt
   - Position: Below title (26mm from top)

3. **Client Data Block** (NEW)
   - Label: "NABYWCA / INWESTOR:" (grey, 8pt)
   - Client Name (bold, black, 9pt)
   - Client Address (normal, dark grey, 8pt, multi-line)
   - Client NIP (normal, dark grey, 8pt)
   - Position: Below date (starts at 36mm from top)
   - Alignment: Right-aligned
   - Max width: 80mm

### Divider Line
- Position: Below the tallest content (company OR client block)
- Style: Light grey (RGB: 220, 220, 220)
- Width: 0.5pt
- Spans: Full page width (14mm to 196mm)

## Project Info Block
- **Label:** "PROJEKT:" (grey, 9pt)
- **Project Name:** (bold, black, 11pt)
- **Region:** (normal, dark grey, 9pt)
- **Object Type:** (normal, dark grey, 9pt)

## Color Legend (Right Side, if colors enabled)
- Position: Aligned with Project Info block
- Font size: 7-8pt
- Lists all color meanings for the estimate table

## Dynamic Layout Logic

### Vertical Positioning
The divider line position is calculated as:
```typescript
const dividerY = Math.max(companyY, clientY || 32, 32);
```

This ensures:
- Divider is always below company details
- Divider is always below client data (if present)
- Minimum position is 32mm from top

### Multi-line Support
Both company address and client address support automatic text wrapping:
```typescript
const addressLines = doc.splitTextToSize(text, maxWidth);
```

## Styling Rules

### Colors (when `showColors = true`)
- **Blue** (RGB: 37, 99, 235): Titles, company name, prices
- **Grey** (RGB: 100, 100, 100): Labels
- **Dark Grey** (RGB: 60, 60, 60): Details
- **Black** (RGB: 0, 0, 0): Main text

### Fonts
- **Primary:** Roboto (embedded for Polish character support)
- **Fallback:** Helvetica (with character transliteration)
- **Styles:** Normal, Bold

### Font Sizes
- **Title:** 14pt
- **Subtitle:** 10-11pt
- **Body:** 8-9pt
- **Small:** 7pt

## Client Data Visibility
Client data block is only rendered if `project.client_name` exists.
If no client data is provided:
- Block is skipped entirely
- Divider line position is calculated without it
- No empty space is left

## Responsive Behavior
- Logo presence adjusts company details starting position
- Client data length adjusts divider position
- Address wrapping prevents text overflow
- All measurements in millimeters for consistency
