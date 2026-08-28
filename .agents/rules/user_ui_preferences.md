# User UI Preferences & System Design Contract

1. **NO WHITE & NO BLUE**: Never use `#ffffff` white backgrounds or `#1d4ed8`/`#3b82f6` blue colors anywhere in the UI.
2. **NO DISCO LIGHTS / NEON COLORS**: Never use bright neon colors or dark cyberpunk glowing LED lights. Colors must be soft, natural, dignified, and traditional.
3. **CLASSIC FINANCIAL LEDGER FEEL**:
   - Page Background: Warm cream paper (`#f4efe0`).
   - Card/Container Background: Soft warm almond parchment (`#eae3d2`).
   - Text/Typography: Rich dark espresso brown ink (`#2c1f14`).
   - Borders: Subtle dark walnut/parchment (`#b8a88a`).
   - Badges & Buttons: Soft muted earth tones (Sage Green `#d9e5d6`, Terracotta `#eddcd0`, Soft Plum `#e3d7e8`, Muted Gold `#ebd8ab`).
4. **SINGLE HORIZONTAL ROW TOP BAR**: Lock page title, boarder count, and summary stat pills into ONE non-wrapping horizontal row (`white-space: nowrap`, `flex-nowrap`).
5. **THINNER SIDEBAR & SOFT SCALE**: Sidebar width `210px`, comfortable typography scale (`12px–13px`).
6. **NO DECIMALS**: Remove all `.00` decimals everywhere. Format as rounded integers with commas (e.g. `K 1,250`).
