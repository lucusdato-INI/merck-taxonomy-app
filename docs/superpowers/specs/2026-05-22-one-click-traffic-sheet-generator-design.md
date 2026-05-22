# One-Click Traffic Sheet Generator

**Date:** 2026-05-22
**Approach:** Smart Template Generator (Approach A)

## Summary

Transform the CTT Taxonomy Generator from a 5-step form-based app into a one-click blocking chart to traffic sheet converter. The app parses a blocking chart, auto-fills every determinable field, and outputs a formula-based Excel traffic sheet where unknown cells are highlighted yellow for planners to complete manually. The CTT taxonomy dictionary (`ctt-taxonomy-dictionary.json`) replaces hardcoded dropdown values as the authoritative source of valid field values.

## Goals

1. Zero manual entry in the app -- upload blocking chart, download traffic sheet
2. Formula-based Excel output so planners can fill yellow cells and taxonomy strings auto-update
3. CTT dictionary as the single source of truth for all valid dropdown values
4. Dynamic tab naming based on detected product and campaign
5. Maximize auto-fill accuracy from blocking chart data

## Non-Goals

- Multi-campaign support (one BC = one traffic sheet)
- Server-side processing or database
- In-app taxonomy string editing or preview
- Admin panel for managing the dictionary

---

## 1. UI: Single-Page Converter

The entire app becomes one page with three visual states.

### State 1: Empty (Upload)

- Drag-and-drop upload zone (reuse existing `FileUploader` component)
- Title: "CTT Traffic Sheet Generator"
- Accepts `.xlsx` only
- Brief instructions text

### State 2: Processing

- Spinner overlay on the upload zone
- Status text: "Parsing blocking chart..." then "Generating traffic sheet..."

### State 3: Complete (Results)

Summary card displaying:
- **Detected product** and **campaign name** (from BC metadata)
- **Row counts** per channel: Social: X, Digital: Y, Search: Z
- **Yellow cell count**: N cells need planner input
- **Warnings list** (collapsible): unknown platforms skipped, missing columns, ambiguous fields
- **"Download Traffic Sheet"** button (large, prominent)
- **"Upload Another"** link to reset to State 1

### Components

| Component | Action |
|---|---|
| `FileUploader.tsx` | KEEP -- drag-drop upload, minor styling updates |
| `ResultSummary.tsx` | NEW -- summary card with download button |
| `CampaignForm.tsx` | REMOVE |
| `TacticReview.tsx` | REMOVE |
| `TaxonomyPreview.tsx` | REMOVE |
| `DownloadPanel.tsx` | REMOVE |
| `App.tsx` | SIMPLIFY -- single page, no step flow |

---

## 2. CTT Dictionary Integration

### Source of truth hierarchy

1. `ctt-taxonomy-dictionary.json` -- valid values for all dropdowns
2. `config.ts` -- product-specific defaults, platform-to-channel mappings, acronym maps

### What stays in config.ts

- **Product configs** (PCN, GSL, GSL_HCP): default personas, geo, audience, content purpose, province lists per language
- **Platform mappings**: BC platform name to channel/source/site/utm_medium/defaults (21 mappings)
- **Acronym maps**: full CTT name to taxonomy acronym (these are Canada-specific conventions not in the dictionary)
- `matchPlatform()`, `isSkippedPlatform()`, `normalizeDimension()`, `inferAdFormat()`, `mapKpiToObjective()` functions

### What the dictionary provides

- Valid product names (400+)
- Campaign types: Co-Branded, Branded, Mix Branding, Unbranded, Other, Competitor
- Objectives: 19 values (Action, Awareness, Advocacy, Consideration, Engagement, etc.)
- Audiences: 16 types (Healthcare Professional, Healthcare Consumer, Dentist, etc.)
- Content purposes: 14 values
- Ad formats: 26 values
- Sources per medium: Social (16), Search (10), Display (80+)
- Placements: 30+ values per medium
- Tactic types: 19 values
- Geos: 8 values (International, National, Sub-national, Local, etc.)
- Buy types: 10 values (Display only)
- Match types: 5 values (Search only)
- Markets: 170+ countries

### New file: `src/engine/cttMappings.ts`

Bidirectional mapping between CTT dictionary full names and taxonomy string acronyms:

```typescript
// Campaign types
"Branded" <-> "BRND"
"Unbranded" <-> "NON"
"Co-Branded" <-> "CBRDN"
"Mix Branding" <-> "MIX"

// Objectives
"Awareness" <-> "AW"
"Consideration" <-> "CONSD"
"Traffic" <-> "TF"
"Conversion" <-> "CV"
"Engagement" <-> "ENG"
"Action" <-> "ACT"
// ...etc for all 19

// Audiences
"Healthcare Consumer" <-> "HCCO"
"Healthcare Professional" <-> "HCP"
// ...etc

// Content purposes
"Product Awareness" <-> "PRDAW"
"Disease Awareness" <-> "DA"
"Corporate" <-> "COR"
// ...etc

// Ad formats
"Image" <-> "IMG"
"Video" <-> "VID"
"Audio" <-> "AUDIO"
"Text" <-> "TXT"
"Custom" <-> "CSTM"
"Canvas" <-> "CAN"
"Native" <-> "NAT"
"Carousel" <-> "CRSL"
// ...etc

// Geos
"National" <-> "NTL"
"Local" <-> "LCL"
"Sub-national" <-> "SUBN"
// ...etc

// Buy types
"Cost per Thousand Impressions" <-> "CPM"
"Cost per Click" <-> "CPC"
"Cost per Action" <-> "CPA"
"Cost per Completed View" <-> "CPCV"
"Flat rate" <-> "FLAT"
// ...etc

// Match types
"Broad" <-> "BROD"
"Broad, Phase, Exact" <-> "BPE"
"Broad Match Modified" <-> "BMM"
"Phrase" <-> "PHRS"
"Exact" <-> "EXCT"
```

Exported functions:
- `toAcronym(category, fullName) -> string` -- for taxonomy string generation
- `toFullName(category, acronym) -> string` -- for dropdown display
- `getValidValues(category, medium?) -> string[]` -- pull from dictionary, optionally filtered by medium
- `getDictionaryField(fieldName, medium?) -> { type, required, values }` -- raw dictionary access

---

## 3. Enhanced BC Parser

### Metadata extraction

The parser attempts to extract from the first 15 rows of the BC:

| Field | Extraction strategy | Fallback |
|---|---|---|
| Product | Scan title/metadata for product keywords ("Capvaxive" -> PCN, "Gardasil"/"G9" -> GSL, "HCP" suffix -> GSL_HCP) | Unknown (yellow) |
| Campaign Name | Scan for "Campaign Name:" label or extract from title text | File name cleaned |
| Year & Month | Parse flight date range, use start month as YYYYMM | Unknown (yellow) |
| Start Date | Parse "Flight:" or date range in metadata rows | Unknown (yellow) |
| End Date | Parse end of date range | Unknown (yellow) |

### Per-tactic extraction

For each data row in the BC:

| Field | Source column(s) | Parsing logic |
|---|---|---|
| Platform | Sites/Tactics (C1 or C2) | Fuzzy match against PLATFORM_MAPPINGS |
| Channel | Derived from platform match | SOC, DISP, or search |
| Source | Derived from platform match | Lowercase platform name |
| Site | Derived from platform match | Display only |
| Language | Language column | Split "EN/FR" into [EN, FR] |
| Dimensions | Formats/Placement column | Split by comma/semicolon, normalize ratios |
| Ad Format | Inferred from dimensions | 1920x1080 -> VID, 30s -> AUDIO, else IMG |
| Buy Type | KPI column mapping | CPM -> CPM, CPC -> CPC, etc. |
| Placement | Placement/Placements column | Map to CTT placement value |
| Region/Province | Region/Markets column | Parse province codes |
| Targeting/Persona | Targeting/Audience column | Extract named personas or age demographics |
| Age Demo | Targeting column | Parse "F27-45" -> age=27-45, gender=F |
| Gender | Targeting column | Parse gender prefix from demographic strings |

### Skip rules (unchanged)

Skip rows containing: TOTAL, BUDGET, REVISION, section headers (DIGITAL, SOCIAL, SEARCH, VIDEO, OOH), empty platform cells. Skip platforms matching `isSkippedPlatform()` (Broadcast TV, Radio, OOH, DOOH, Print, etc.).

### Layout detection (unchanged)

- **Multi-tab (Gardasil):** Detected by presence of province tab names (Quebec, Ontario, BC & Alberta). Each province tab parsed separately.
- **Single-tab (Capvaxive/HCP):** All data on one sheet.

---

## 4. Row Explosion

### Explosion dimensions

For each parsed tactic, generate rows for the Cartesian product of:
- **Languages** (from BC: EN, FR, or both)
- **Dimensions** (from BC: e.g., 1x1, 9x16, 300x250)
- **Provinces per language** (from product config: EN -> AB/BC/ON, FR -> QC; or NA for NTL products)

### Persona handling

- If the BC targeting text explicitly names personas (e.g., "Maya", "Lila"), explode for those personas
- If the BC targeting text does NOT name personas, generate ONE row per tactic with the persona cell marked yellow
- Do NOT use product-default personas for explosion when they aren't confirmed from the BC

### Output per exploded row

Each row is a flat record with all component field values + a confidence tag per cell:

```typescript
interface ExplodedRow {
  channel: 'SOC' | 'DISP' | 'search';
  fields: Record<string, { value: string; confidence: 'auto' | 'inferred' | 'default' | 'unknown' }>;
  tacticId: string;
}
```

Confidence levels:
- `auto` -- directly extracted from BC (platform, language, dimensions)
- `inferred` -- derived via mapping (KPI -> buy type, dimension -> ad format)
- `default` -- from product config (audience, content purpose, geo)
- `unknown` -- not determinable -> yellow cell in output

---

## 5. Formula-Based Excel Output

### New file: `src/engine/formulaSheetWriter.ts`

Replaces `trafficSheetWriter.ts`. Generates an ExcelJS workbook with formula columns.

### Tab structure

Dynamic tab names using pattern `{ProductAcronym} {CampaignName} {Channel} Taxonomy`:
1. `{Product} {Campaign} Social Taxonomy` -- Social channel rows
2. `Social Dropdown List` -- CTT dictionary values for Social fields
3. `{Product} {Campaign} Digital Taxonomy` -- Display channel rows
4. `Display Dropdown List` -- CTT dictionary values for Display fields
5. `{Product} {Campaign} Search Taxonomy` -- Search channel rows
6. `Search Dropdown List` -- CTT dictionary values for Search fields

Tabs are only created if there are rows for that channel.

### Column layouts

**Social Taxonomy columns (A-AL):**

| Col | Header | Type | Source |
|---|---|---|---|
| A | Market | Component | Default "CA" |
| B | Product | Component | Auto-detected |
| C | Campaign Name | Component | Auto-detected |
| D | Campaign Type | Component | Default or yellow |
| E | Objective | Component | Inferred from KPI or yellow |
| F | Year & Month | Component | Auto-detected |
| G | Custom Tag 1 | Component | Default "Social" |
| H | **Campaign** | **Formula** | `=A&"_"&B&"_"&C&"_"&D&"_"&E&"_"&F&"_"&G` |
| I | Start date | Component | Auto-detected or yellow |
| J | End Date | Component | Auto-detected or yellow |
| K | Channel | Component | "SOC" (from platform mapping) |
| L | Source | Component | From platform mapping (lowercase) |
| M | Audience | Component | Product default |
| N | Persona | Component | From BC targeting or yellow |
| O | Gender | Component | From BC targeting or default "All" |
| P | Gender Acronym | Component | From BC targeting or default "A" |
| Q | Age Demo | Component | From BC targeting or yellow |
| R | Placement | Component | From platform default or yellow |
| S | Tactic Type | Component | From platform default or yellow |
| T | Geo | Component | Product default (NTL or LCL) |
| U | Language | Component | From BC |
| V | Province | Component | From product config per language |
| W | **Ad Set** | **Formula** | `=K&"_"&L&"_"&M&"_"&N&"_"&P&"_"&Q&"_"&R&"_"&S&"_"&T&"_"&U&"+"&V` |
| X | Promomats ID | Component | Yellow (never in BC) |
| Y | Content Purposes | Component | Product default |
| Z | Ad Format | Component | Inferred from dimensions |
| AA | Ad Dimensions | Component | From BC |
| AB | Custom Tag 3 | Component | Yellow |
| AC | **Ad** | **Formula** | `=X&"_"&Y&"_"&Z&"_"&AA&"_"&N&"+"&Q&"+"&O&"+"&U&"+"&V&"+"&AB` |
| AD | Tag? | Component | Yellow |
| AE | Tag Type | Component | Yellow |
| AF | Target URL | Component | Yellow |
| AG | utm_source= | **Formula** | `=L` |
| AH | utm_medium | Component | "paid-social" |
| AI | utm_campaign= | **Formula** | `=A&"_"&B&"_"&C&"_"&D&"_"&E&"_"&F&"_"&G` |
| AJ | utm_adset= | **Formula** | `=M&"_"&N&"_"&P&"_"&Q&"_"&R&"_"&S&"_"&T&"_"&U&"+"&V` |
| AK | utm_content= | **Formula** | `=AC` |
| AL | UTM (String Formula) | **Formula** | `=AF&"?"&$AG$1&AG&"&"&$AH$1&AH&"&"&$AI$1&AI&"&"&$AJ$1&AJ&"&"&$AK$1&AK` |

**Digital Taxonomy columns (A-AN):**

| Col | Header | Type | Notes |
|---|---|---|---|
| A-G | Same campaign components | Component | Same as Social |
| H | **Campaign** | **Formula** | Same as Social, Custom Tag 1 = "Digital" |
| I-J | Dates | Component | Same |
| K | Channel | Component | "DISP" |
| L | Source | Component | From platform mapping |
| M | **Site** | Component | From platform mapping (Digital-specific) |
| N | Audience | Component | Product default |
| O | Persona | Component | From BC or yellow |
| P | Gender | Component | From BC or default "All" |
| Q | Gender Acronym | Component | From BC or default "A" |
| R | Age Demo | Component | From BC or yellow |
| S | Placement | Component | From platform default or yellow |
| T | Tactic Type | Component | From platform default or yellow |
| U | Geo | Component | Product default |
| V | **Buy Type** | Component | Inferred from KPI or yellow |
| W | Language | Component | From BC |
| X | **Placement/Ad Name** | **Formula** | `=K&"_"&L&"_"&M&"_"&N&"_"&O&"_"&Q&"_"&R&"_"&S&"_"&T&"_"&U&"_"&V&"_"&W` |
| Y | Promomats ID | Component | Yellow |
| Z | Content Purposes | Component | Product default |
| AA | Ad Format | Component | Inferred |
| AB | Ad Dimensions | Component | From BC |
| AC | **Creative Name** | Component | Yellow |
| AD | **Geo Targeting** | Component | Province code or yellow |
| AE | **Creative** | **Formula** | `=Y&"_"&Z&"_"&AA&"_"&AB&"_"&AC&"+"&O&"+"&R&"+"&P&"+"&AD&"+"&W&"+"&M` |
| AF | Tag? | Component | Yellow |
| AG | Tag Type | Component | Yellow |
| AH | Landing Page | Component | Yellow |
| AI | utm_source= | **Formula** | `=L&"_"&M` |
| AJ | utm_medium | Component | "display" |
| AK | utm_campaign= | **Formula** | Same as Campaign |
| AL | utm_adset= | **Formula** | `=N&"_"&O&"_"&Q&"_"&R&"_"&S&"_"&T&"_"&U&"_"&V&"_"&W` |
| AM | utm_content= | **Formula** | `=AE` |
| AN | UTM (String Formula) | **Formula** | `=AH&"?"&$AI$1&AI&"&"&$AJ$1&AJ&"&"&$AK$1&AK&"&"&$AL$1&AL&"&"&$AM$1&AM` |

**Search Taxonomy columns (A-AL):**

| Col | Header | Type | Notes |
|---|---|---|---|
| A-F | Campaign components | Component | Same |
| G | Custom Tag 1 | Component | "Search" |
| H | **Campaign** | **Formula** | `=A&"_"&B&"_"&C&"_"&D&"_"&E&"_"&F&"_"&G&"+"&T` (appends +Language) |
| I | Channel | Component | "search" |
| J | Source | Component | "google" |
| K | Audience | Component | Product default |
| L | Persona | Component | Product default or yellow |
| M | Gender Acronym | Component | Default "A" |
| N | Age Demo | Component | From BC or yellow |
| O | Promomats ID | Component | Yellow |
| P | Content Purposes | Component | Product default |
| Q | Match Type | Component | Yellow |
| R | Ad Format | Component | "TXT" |
| S | Ad Dimensions | Component | "NA" |
| T | Language | Component | From BC |
| U | Custom Tag 2 | Component | Yellow |
| V | **Ad Set** | **Formula** | `=I&"_"&J&"_"&K&"_"&L&"_"&M&"_"&N&"_"&O&"_"&P&"_"&Q&"_"&R&"_"&S&"+"&T&"+"&U` |
| W | Landing Page | Component | Yellow |
| X | utm_source= | **Formula** | `=J` |
| Y | utm_medium | Component | "CPC" |
| Z | utm_campaign= | **Formula** | Same as Campaign |
| AA | utm_adset= | **Formula** | `=K&"_"&L&"_"&M&"_"&N&"_"&O&"_"&P&"_"&Q&"_"&R&"_"&S&"+"&T&"+"&U` |
| AB | UTM (String Formula) | **Formula** | `=W&"?"&$X$1&X&"&"&$Y$1&Y&"&"&$Z$1&Z&"&"&$AA$1&AA` |

### Cell formatting

- **Header row:** Bold, light blue background (#D5E8F0), thin borders, frozen
- **Yellow cells (unknown):** Background #FFFF00, placeholder text (empty string or "TBD")
- **Normal cells (auto/inferred/default):** White background
- **Formula cells:** No special background -- they compute from component cells
- **All text format:** `@` number format to prevent Excel misinterpretation
- **Column widths:** Auto-fit, max 50 chars

### Dropdown validation tabs

Each dropdown list tab contains the CTT dictionary values for that medium, organized by field name in columns. Excel data validation is applied to the corresponding component columns in the taxonomy tab, referencing these dropdown ranges.

### File naming

`{ProductAcronym}_{CampaignName}_{YYYYMM}_Traffic_Sheet.xlsx`

---

## 6. Files Changed

| File | Action | Description |
|---|---|---|
| `src/engine/cttMappings.ts` | CREATE | Bidirectional full-name/acronym maps, dictionary accessor functions |
| `src/engine/ctt-taxonomy-dictionary.json` | KEEP | Authoritative dropdown value source |
| `src/engine/config.ts` | MODIFY | Remove dropdown vocabulary lists, keep product configs + platform mappings |
| `src/engine/bcParser.ts` | MODIFY | Enhanced metadata extraction, targeting text parsing for personas/age/gender |
| `src/engine/formulaSheetWriter.ts` | CREATE | Formula-based Excel output with yellow cells and dropdown validation |
| `src/engine/taxonomyBuilder.ts` | MODIFY | Simplify to row exploder only (no string building), add confidence tagging |
| `src/engine/types.ts` | MODIFY | Add ExplodedRow, CellValue (with confidence), remove TaxonomyRow string fields |
| `src/engine/validator.ts` | REMOVE | Validation handled by Excel dropdown constraints |
| `src/engine/trafficSheetWriter.ts` | REMOVE | Replaced by formulaSheetWriter |
| `src/engine/index.ts` | MODIFY | Update exports |
| `src/App.tsx` | MODIFY | Single-page converter (upload -> process -> result) |
| `src/components/FileUploader.tsx` | MODIFY | Minor styling updates |
| `src/components/ResultSummary.tsx` | CREATE | Summary card with download button |
| `src/components/CampaignForm.tsx` | REMOVE | No manual form |
| `src/components/TacticReview.tsx` | REMOVE | No tactic editor |
| `src/components/TaxonomyPreview.tsx` | REMOVE | No preview table |
| `src/components/DownloadPanel.tsx` | REMOVE | Merged into ResultSummary |

---

## 7. Edge Cases

- **Unknown product:** If the parser can't detect the product from BC metadata, product cell is yellow. Product-specific defaults (personas, provinces, geo) fall back to generic (no persona explosion, province = NA, geo = NTL).
- **Unknown platforms:** Skipped with a warning in the summary. Not included in output.
- **Mixed languages:** "EN/FR" in BC generates separate rows for EN and FR, each with their own province set.
- **Empty dimensions:** If no dimensions found, use a single row with dimension = "NA" (yellow).
- **Influencer detection:** If BC placement/targeting text contains "influencer" or "content creator", set Custom Tag 1 to "Social+Influencer" and mark influencer name as yellow.
- **Search campaigns:** Auto-set source = "google", ad format = "TXT", ad dimensions = "NA". Match type always yellow.
- **Multi-tab BCs (Gardasil):** Parse each province tab, merge tactics. Province comes from the tab name.
- **No rows for a channel:** Don't create that channel's taxonomy tab or dropdown tab.

---

## 8. Testing Strategy

- **Unit tests** for `cttMappings.ts`: acronym lookups, bidirectional mapping, dictionary value retrieval
- **Unit tests** for enhanced `bcParser.ts`: metadata extraction, targeting text parsing, both BC layouts
- **Unit tests** for row explosion: language/dimension/province Cartesian product, persona-present vs persona-absent
- **Integration test**: parse each of the 3 sample BCs -> verify row counts, auto-filled values, yellow cell counts
- **Manual test**: open generated .xlsx in Excel, verify formulas compute correctly, yellow cells are editable, dropdown validation works
