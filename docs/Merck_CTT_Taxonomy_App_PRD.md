# Product Requirements Document: Merck CTT Taxonomy Generator

## 1. Overview

### What this is

A lightweight, standalone web application that generates MSD CTT-compliant taxonomy strings for Merck Canada media campaigns. A planner uploads a blocking chart, fills in a short metadata form, and downloads a complete traffic sheet with all Social, Digital, and Search taxonomy strings pre-populated.

### What this replaces

Today, planners manually enter each line item into the MSD CTT webform one at a time, copy the output strings, and paste them into a traffic sheet. A single campaign can require hundreds of entries. This app automates the entire process in a single step.

### Who uses it

Media planners on the Merck/MSD account at Initiative Canada. They are not technical users. The app must feel like a simple utility: upload, configure, download. No accounts, no login, no database.

### What it does NOT do

- Does not store any data between sessions
- Does not require authentication or user accounts
- Does not call any external APIs or backend services
- Does not replace the CTT webform for ad-hoc single-string lookups
- Does not handle non-digital platforms (Broadcast TV, Radio, OOH)

---

## 2. Tech Stack

| Layer         | Technology                                       | Rationale                                                        |
| ------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| Build tool    | Vite                                             | Fast dev server, minimal config, tree-shaking                    |
| UI framework  | React 18+                                        | Component model fits the form + preview + download flow          |
| Styling       | Tailwind CSS                                     | Utility-first, fast to build, no CSS files to manage             |
| Excel parsing | ExcelJS (browser build)                          | Reads .xlsx in the browser, no server needed                     |
| Excel output  | ExcelJS (browser build)                          | Writes .xlsx with formatting, dropdowns, and multi-tab structure |
| File download | file-saver                                       | Triggers browser download of generated .xlsx                     |
| Hosting       | Static (Vercel, Netlify, or internal SharePoint) | No backend, deploy as static files                               |

All processing happens client-side. No server, no Node.js runtime, no database.

### Project structure

```
merck-taxonomy-app/
  public/
  src/
    components/
      FileUploader.jsx           # Drag-and-drop BC upload
      CampaignForm.jsx           # Metadata input form
      TacticReview.jsx           # Parsed tactics table with edit capability
      PersonaEditor.jsx          # Per-tactic persona and promomats assignment
      TaxonomyPreview.jsx        # Generated strings preview with validation
      DownloadPanel.jsx          # Export and download controls
    engine/
      config.js                  # All platform, product, and validation configs
      bcParser.js                # Blocking chart parsing logic
      taxonomyBuilder.js         # String construction for Social/Digital/Search
      trafficSheetWriter.js      # Excel output generation with all tabs
      validator.js               # 14 validation rules
    utils/
      excelHelpers.js            # ExcelJS read/write utilities
      formatters.js              # Dimension normalization, string sanitization
    App.jsx                      # Main app shell with step-based flow
    main.jsx                     # Vite entry point
  index.html
  vite.config.js
  tailwind.config.js
  package.json
```

---

## 3. User Flow

The app is a linear, step-based flow. Each step must be completed before the next becomes active.

### Step 1: Upload Blocking Chart

- Single file upload (drag-and-drop or click-to-browse)
- Accepts .xlsx only
- On upload, the app immediately parses the file and extracts:
  - Tab names (to identify single-tab vs multi-tab layouts)
  - Tactic rows (platform, language, targeting/audience, placement description, KPI, region)
  - Campaign header metadata (campaign name, market, total budget, flight dates)
- Display a loading state during parsing
- If parsing fails or no recognizable tactics are found, show an error with guidance

### Step 2: Campaign Configuration Form

After the BC is parsed, display a form pre-filled with any values extracted from the blocking chart headers. The planner fills in or confirms the rest.

**Required fields (always shown):**

| Field                 | Type                                                        | Default | Pre-fill source                        |
| --------------------- | ----------------------------------------------------------- | ------- | -------------------------------------- |
| Product               | Dropdown                                                    | (none)  | Product name in BC header row          |
| Campaign Name (Short) | Text input                                                  | (none)  | BC "Campaign Name" header row, cleaned |
| Campaign Type         | Dropdown: Branded / UnBranded / Co-Branded                  | Branded | (none)                                 |
| Objective             | Dropdown: Awareness / Consideration / Traffic / Conversion  | (none)  | BC KPI column if mappable              |
| Year & Month          | Text input (YYYYMM)                                         | (none)  | Earliest flight date from BC           |
| Audience              | Dropdown: HCCO / HCP                                        | HCCO    | Inferred from product selection        |
| Content Purpose       | Dropdown: Product Awareness / Disease Awareness / Corporate | (none)  | From product config default            |
| Target URL            | Text input                                                  | (none)  | (none)                                 |

**Product dropdown options:**

- Capvaxive (PCN) - auto-sets audience to HCCO, content purpose to Product Awareness
- Gardasil 9 Consumer (GSL) - auto-sets audience to HCCO, content purpose to Disease Awareness
- Gardasil 9 HCP (GSL_HCP) - auto-sets audience to HCP, content purpose to Disease Awareness

When the planner selects a product, the form auto-fills default values and the persona configuration (Step 3) updates to show the correct personas for that product.

### Step 3: Review Parsed Tactics

Display a table showing every tactic row parsed from the blocking chart. Columns:

| Column                | Editable?                               | Source                            |
| --------------------- | --------------------------------------- | --------------------------------- |
| Platform              | Dropdown (from platform config)         | BC "Tactics"/"Sites" column       |
| Language              | Dropdown: EN / FR / EN/FR               | BC "Language" column              |
| Targeting Description | Read-only                               | BC "Targeting"/"Audience" column  |
| Placement Description | Read-only                               | BC "Placement" column             |
| Region                | Read-only                               | BC "Region"/"Market" column       |
| Personas              | Multi-select checkboxes                 | Product config defaults, editable |
| Dimensions            | Editable text                           | BC "Formats" column or "TBD"      |
| Buy Type              | Dropdown: CPM / CPC / CPA / CPCV / FLAT | Platform config default           |
| Promomats ID (EN)     | Text input                              | Blank (planner fills in)          |
| Promomats ID (FR)     | Text input                              | Blank (planner fills in)          |
| Creative Name         | Text input                              | Blank (planner fills in)          |
| Include?              | Checkbox                                | Checked by default                |

**Key behaviors:**

- Rows with unrecognized platforms are highlighted in amber and excluded by default (checkbox unchecked)
- Rows for skipped platforms (Broadcast TV, Radio, etc.) are hidden entirely
- Duplicate rows (same platform + same targeting) are collapsed with a count badge
- The planner can uncheck rows to exclude specific tactics from taxonomy generation
- The persona checkboxes are pre-populated from the product config but editable per row
- Promomats IDs and Creative Names are the main fields the planner fills in here

### Step 4: Preview and Validate

After the planner clicks "Generate Taxonomy", the app runs the taxonomy engine and displays:

**Summary panel:**

- Total rows: X social, Y digital, Z search
- Validation: X errors, Y warnings

**Tabbed preview:**
Three tabs (Social, Digital, Search) each showing a scrollable table with all generated taxonomy strings. Each row shows:

- Campaign string
- Ad Set / Placement string
- Ad / Creative string (if applicable)
- UTM string
- Validation status (green check, amber warning, red error)

**Validation errors** are shown inline on the affected row with the rule ID and message. The planner can click to expand details.

**Editable cells:** The planner can click any generated string to edit it manually in a text input. Edited cells are marked with a blue indicator so the planner knows which strings they've manually overridden.

### Step 5: Download

A prominent "Download Traffic Sheet" button that:

1. Generates a complete .xlsx file with all required tabs
2. Triggers a browser download
3. The filename follows the pattern: `{Product}_{CampaignName}_{YYYYMM}_Traffic_Sheet.xlsx`

---

## 4. Traffic Sheet Output Structure

The generated .xlsx must contain these tabs in this order:

### Tab 1: Social Taxonomy

Header row (row 1) with these exact column names:

```
A: Market
B: Product
C: Campaign Name
D: Campaign Type
E: Objective
F: Year & Month
G: Custom Tag 1
H: Campaign
I: Start date
J: End Date
K: Channel
L: Source
M: Audience
N: Persona
O: Gender
P: Gender Acronym
Q: Age Demo
R: Placement
S: Tactic Type
T: Geo
U: (Custom Tag 2) Language
V: (Custom Tag 2) Province
W: Ad Set
X: Promomats ID
Y: Content Purposes
Z: Ad Format
AA: Ad Dimensions
AB: Custom Tag 3
AC: Ad
AD: Tag?
```

Plus UTM columns:

```
AE: utm_source=
AF: utm_medium=
AG: utm_campaign=
AH: utm_adset=
AI: utm_content=
AJ: UTM Tag
```

### Tab 2: Social Dropdown List

Pre-populated reference tab with all valid values for each taxonomy field. See Section 7 (Dropdown Vocabularies) for exact values.

### Tab 3: Digital Taxonomy

Header row with these exact column names:

```
A: Market
B: Product
C: Campaign Name
D: Campaign Type
E: Objective
F: Year & Month
G: Custom Tag 1
H: Campaign
I: Start date
J: End Date
K: Channel
L: Source
M: Site
N: Audience
O: Persona
P: Gender
Q: Gender Acronym
R: Age Demo
S: Placement
T: Tactic Type
U: Geo
V: Buy Type
W: (Custom Tag 2) Language
X: Placement/Ad Name
Y: Promomats ID
Z: Content Purposes
AA: Ad Format
AB: Ad Dimensions
AC: Creative Name
AD: Geo Targeting
AE: Creative
```

Plus UTM columns:

```
AF: utm_source=
AG: utm_medium=
AH: utm_campaign=
AI: utm_adset=
AJ: utm_content=
AK: UTM Tag
```

### Tab 4: Display Dropdown List

Pre-populated reference tab for digital taxonomy valid values.

### Tab 5: Search Taxonomy

Header row:

```
A: Market
B: Product
C: Campaign Name
D: Campaign Type
E: Objective
F: Year & Month
G: Custom Tag 1
H: Campaign
I: Channel
J: Source
K: Audience
L: Persona
M: Gender Acronym
N: Age Demo
O: Promomats ID
P: Content Purposes
Q: Match Type
R: Ad Format
S: Ad Dimensions
T: Language
U: Custom Tag 2
V: Ad Set
W: Landing Page (https://)
X: utm_source=
Y: utm_medium=
Z: utm_campaign=
AA: utm_adset=
AB: UTM Tag
```

### Tab 6: Search Dropdown List

Pre-populated reference tab for search taxonomy valid values.

### Tab 7: Feedback

Pre-populated with the 14 validation rules as a reference for the planner. Two columns: "Rule" and "Description". This matches the existing Feedback tab format from client traffic sheets.

---

## 5. Taxonomy String Templates

These are the exact string construction rules. Each field is separated by underscores (`_`). Compound metadata fields are joined with plus signs (`+`). These templates have been verified against production traffic sheets.

### 5.1 Social

**Campaign:**

```
{market}_{product}_{campaignName}_{campaignType}_{objective}_{yearMonth}_{customTag1}
```

Example: `CA_PCN_YOTM2026_BRND_TF_202604_Social`

When the campaign includes influencer content, Custom Tag 1 becomes `Social+Influencer`.

**Ad Set:**

```
{channel}_{source}_{audience}_{persona}_{genderAcronym}_{ageDemo}_{placement}_{tacticType}_{geo}_{language}+{province}
```

Example: `SOC_meta_HCCO_Harriet-Alma_A_50-99_CSTM_DEMO_NTL_EN+NA`

When influencer content is present, append the influencer name: `...EN+ON+Brian`

**Ad:**

```
{promoId}_{contentPurpose}_{adFormat}_{adDimensions}_{persona}+{ageDemo}+{genderFull}+{language}+{province}+{customTag3}
```

Example: `CA-PCN-00146_PRDAW_IMG_1x1_Harriet-Alma+50-99+All+EN+NA+Hospitalization`

CF3 field order (after the fourth underscore): Persona + Age + GenderFull + Language + Province + CustomTag3

**UTM:**

```
{targetUrl}?utm_source={source}&utm_medium=paid-social&utm_campaign={campaignString}&utm_adset={adSetWithoutChannelSource}&utm_content={adString}
```

### 5.2 Digital

**Campaign:**

```
{market}_{product}_{campaignName}_{campaignType}_{objective}_{yearMonth}_Digital
```

Example: `CA_PCN_YOTM2026_BRND_TF_202604_Digital`

**Placement / Ad Name:**

```
{channel}_{source}_{site}_{audience}_{persona}_{genderAcronym}_{ageDemo}_{placement}_{tacticType}_{geo}_{buyType}_{language}
```

Example: `DISP_nativetouch_nativetouch_HCCO_Harriet-Alma_A_50-99_CSTM_DEMO_NTL_CPM_EN`

**Creative:**

```
{promoId}_{contentPurpose}_{adFormat}_{adDimensions}_{creativeName}+{persona}+{ageDemo}+{genderFull}+{province}+{language}+{platform}
```

Example: `CA-PCN-00103_PRDAW_IMG_300x250_Hospitalization+Harriet-Alma+50-99+All+NA+EN+nativetouch`

CF3 field order: CreativeName + Persona + Age + GenderFull + Province + Language + Platform

Note: The Digital Creative CF3 order differs from Social Ad CF3 order. Language and Province are swapped, and Platform is appended.

**UTM:**

```
{targetUrl}?utm_source={source}_{site}&utm_medium=display&utm_campaign={campaignString}&utm_adset={placementWithoutChannelSourceSite}&utm_content={creativeString}
```

### 5.3 Search

**Campaign:**

```
{market}_{product}_{campaignName}_{campaignType}_{objective}_{yearMonth}_{customTag1}+{language}
```

Example: `CA_PCN_YOTM2026_BRND_CV_202604_Search+EN`

Note the language suffix appended with `+` after CustomTag1.

**Ad Set:**

```
search_{source}_{audience}_{persona}_{genderAcronym}_{ageDemo}_{promoId}_{contentPurpose}_{matchType}_{adFormat}_{adDimensions}+{language}+{customTag2}
```

Example: `search_google_HCCO_AllAdults_A_50-99_CA-PCN-00096_PRDAW_BPE_TXT_NA+EN+AboutIPD`

**UTM:**

```
{targetUrl}?utm_source={source}&utm_medium=CPC&utm_campaign={campaignString}&utm_adset={adSetWithoutSearchSource}
```

---

## 6. Product Configurations (Baked In)

These configs are hardcoded into the app. They define product-specific defaults, persona structures, and province mappings.

### 6.1 Capvaxive (PCN)

```json
{
  "product_name": "Capvaxive",
  "product_acronym": "PCN",
  "default_audience": "HCCO",
  "default_content_purpose": "PRDAW",
  "personas": {
    "type": "paired",
    "pairs": {
      "female": {
        "pair_name": "Harriet-Alma",
        "individual_names": ["Harriet", "Alma"],
        "gender": "All",
        "gender_acronym": "A",
        "age_demo": "50-99"
      },
      "male": {
        "pair_name": "Henri-Archie",
        "individual_names": ["Henry", "Archie"],
        "gender": "All",
        "gender_acronym": "A",
        "age_demo": "50-99"
      }
    },
    "geo_behavior": "national",
    "geo_code": "NTL",
    "province": "NA"
  },
  "provinces_en": ["AB", "BC", "ON", "QC"],
  "provinces_fr": ["QC"]
}
```

When a product uses paired personas:

- Gender at ad set level is always "A" (All), gender at ad level is always "All"
- Geo is always "NTL" (National), Province is always "NA"
- Rows do NOT explode per province (the pair represents all provinces)

### 6.2 Gardasil 9 Consumer (GSL)

```json
{
  "product_name": "Gardasil 9",
  "product_acronym": "GSL",
  "default_audience": "HCCO",
  "default_content_purpose": "DA",
  "personas": {
    "type": "individual",
    "named": {
      "Sofia-Maya": { "gender": "Female", "gender_acronym": "F", "age_demo": "27-45" },
      "Chris-Adam": { "gender": "Male", "gender_acronym": "M", "age_demo": "27-45" },
      "Jamal": { "gender": "All", "gender_acronym": "A", "age_demo": "18-26" },
      "Lila": { "gender": "Female", "gender_acronym": "F", "age_demo": "27-45" },
      "Adam": { "gender": "Male", "gender_acronym": "M", "age_demo": "27-45" },
      "Maya": { "gender": "Female", "gender_acronym": "F", "age_demo": "30-45" },
      "Chris": { "gender": "Male", "gender_acronym": "M", "age_demo": "27-45" }
    },
    "geo_behavior": "per_province",
    "geo_code": "LCL"
  },
  "provinces_en": ["AB", "BC", "ON"],
  "provinces_fr": ["QC"]
}
```

When a product uses individual personas:

- Each persona has its own gender and age demo
- Rows explode per persona x province x language x dimension
- Geo is "LCL" (Local), Province is the specific province code

### 6.3 Gardasil 9 HCP (GSL_HCP)

```json
{
  "product_name": "Gardasil 9 HCP",
  "product_acronym": "GSL",
  "default_audience": "HCP",
  "default_content_purpose": "DA",
  "personas": {
    "type": "individual",
    "named": {
      "AllAdults": { "gender": "All", "gender_acronym": "A", "age_demo": "18-99" }
    },
    "geo_behavior": "per_province",
    "geo_code": "LCL"
  },
  "provinces_en": ["AB", "BC", "ON"],
  "provinces_fr": ["QC"]
}
```

---

## 7. Platform Mappings (Baked In)

Each platform from the blocking chart maps to a set of taxonomy field defaults:

| BC Platform Name     | Channel | Source            | Site              | UTM Medium  | Custom Tag 1 | Default Buy Type | Default Placement | Default Tactic Type |
| -------------------- | ------- | ----------------- | ----------------- | ----------- | ------------ | ---------------- | ----------------- | ------------------- |
| META                 | SOC     | meta              | (none)            | paid-social | Social       | (none)           | CSTM              | DEMO                |
| TIKTOK               | SOC     | tiktok            | (none)            | paid-social | Social       | (none)           | CSTM              | DEMO                |
| REDDIT               | SOC     | reddit            | (none)            | paid-social | Social       | (none)           | CSTM              | DEMO                |
| LINKEDIN             | SOC     | linkedin          | (none)            | paid-social | Social       | (none)           | CSTM              | DEMO                |
| PINTEREST            | SOC     | pinterest         | (none)            | paid-social | Social       | (none)           | CSTM              | DEMO                |
| NATIVE TOUCH         | DISP    | nativetouch       | nativetouch       | display     | Digital      | CPM              | CSTM              | DEMO                |
| THE WEATHER NETWORK  | DISP    | theweathernetwork | theweathernetwork | display     | Digital      | CPM              | CSTM              | DEMO                |
| YOUTUBE              | DISP    | youtube           | YouTube           | display     | Digital      | CPM              | CTV               | CSTM                |
| YOUTUBE (DEMAND GEN) | DISP    | youtube           | YouTube           | display     | Digital      | CPM              | CTV               | CSTM                |
| SPOTIFY              | DISP    | spotify           | Spotify           | display     | Digital      | CPM              | CSTM              | CSTM                |
| ACAST                | DISP    | acast             | Acast             | display     | Digital      | FLAT             | CSTM              | CSTM                |
| GOOGLE SEARCH        | search  | google            | (none)            | CPC         | Search       | (none)           | CSTM              | CSTM                |
| PMAX                 | search  | google            | (none)            | CPC         | Search+Pmax  | (none)           | CSTM              | CSTM                |
| MEDSCAPE             | DISP    | medscape          | Medscape          | display     | Digital      | CPM              | CSTM              | CSTM                |
| CHN                  | DISP    | chn               | CHN               | display     | Digital      | CPM              | CSTM              | CSTM                |
| DV360                | DISP    | dv360             | DV360             | display     | Digital      | CPM              | CSTM              | CSTM                |
| DV360- GUMGUM        | DISP    | dv360             | DV360             | display     | Digital      | CPM              | CSTM              | CSTM                |
| KINESSO (DV360)      | DISP    | dv360             | DV360             | display     | Digital      | CPM              | CSTM              | CSTM                |
| SCREEN-ON-DEMAND     | DISP    | screen-on-demand  | Amazon            | display     | Digital      | CPM              | CTV               | CSTM                |
| GRINDR               | DISP    | grindr            | Grindr            | display     | Digital      | CPM              | CSTM              | CSTM                |
| DEXERTO              | DISP    | dexerto           | Dexerto           | display     | Digital      | CPM              | CSTM              | CSTM                |

**Skipped platforms** (not digital, excluded from parsing):
BROADCAST TV, RADIO, IMD, CMAJ, JAMC, STINGRAY, EIUM, COMMUNIMED

Platform matching logic must handle:

- Case-insensitive matching
- Partial matches (e.g., "DV360- GumGum" matches "DV360")
- Multi-word platform names with varying separators (dashes, spaces, parentheses)
- The match should prefer the most specific match (e.g., "DV360- GUMGUM" over "DV360")

---

## 8. Blocking Chart Parsing Rules

The BC parser must handle two distinct layouts:

### Layout A: Single-tab (Capvaxive style)

- One "Blocking Chart" tab with all tactics
- Header row contains: Tactics (col A/B), Language, Audience, Formats, Placements, KPI
- Tactic names inherit downward (if col A is empty, use the last non-empty value above)
- Section headers like "DIGITAL", "SOCIAL", "H1", "H2" are not tactics and should be skipped

### Layout B: Multi-tab by province (Gardasil style)

- Separate tabs per region: "Blocking Chart" (main), "Quebec", "BC & Alberta", "Ontario"
- Each tab has the same structure but different column positions
- Header row contains: Sites (col A), Language, Placement, Targeting, Region
- The same tactic appears in multiple tabs; only the tab with non-zero budget/impressions is active
- The "Budget splits per channel" tab should be ignored (it's a reference, not tactics)

### Common parsing rules

- The header row is identified by finding a cell containing "Tactics" or "Sites"
- Campaign metadata (Market, Campaign Name, Flight Dates, Total Budget) is extracted from rows 4-9 above the header
- Skip rows where the tactic name contains "TOTAL", "BUDGET", "REVISION"
- Language "EN/FR" means generate rows for both languages
- Year is extracted from the header row (row 11-13 typically)
- Flight dates are datetime values in the week-by-week columns

---

## 9. Validation Rules

The app must enforce these 14 rules, derived from actual client feedback on past traffic sheets. Each rule runs against every generated string before output.

| ID  | Rule                                                                                                                                     | Severity | Applies To                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------- |
| V01 | No spaces allowed in Custom Tag 3 values. Auto-sanitize by removing spaces.                                                              | Error    | Social Ad, Digital Creative      |
| V02 | Gender at Ad/Creative level must be the full word: "All", "Male", or "Female" (not acronyms).                                            | Error    | Social Ad, Digital Creative      |
| V03 | Gender at Ad Set/Placement level must be the single-letter acronym: "A", "M", or "F" (not full words).                                   | Error    | Social Ad Set, Digital Placement |
| V04 | Custom Tag 2 must follow Language+Province order (e.g., "EN+ON", not "ON+EN").                                                           | Error    | Social Ad Set                    |
| V05 | Digital Creative CF3 field order must be: CreativeName+Persona+Age+Gender+Province+Language+Platform.                                    | Error    | Digital Creative                 |
| V06 | Social Ad CF3 field order must be: Persona+Age+Gender+Language+Province+CustomTag3.                                                      | Error    | Social Ad                        |
| V07 | Influencer campaigns must have Custom Tag 1 = "Social+Influencer".                                                                       | Warning  | Social Campaign                  |
| V08 | Search Campaign Custom Tag 1 must include language suffix (e.g., "Search+EN" or "Search+FR").                                            | Error    | Search Campaign                  |
| V09 | Search/Pmax Ad Set source field must always be "google".                                                                                 | Error    | Search Ad Set                    |
| V10 | Taxonomy strings may only contain: letters, numbers, dashes (-), underscores (\_), and plus signs (+). No spaces, no special characters. | Error    | All strings                      |
| V11 | Ad Set string and UTM utm_adset must be aligned (utm_adset = Ad Set without the channel_source prefix).                                  | Error    | Social UTM, Digital UTM          |
| V12 | Ad/Creative string and UTM utm_content must be aligned.                                                                                  | Error    | Social UTM, Digital UTM          |
| V13 | Digital Creative must append the platform name as the last element in the CF3 block.                                                     | Error    | Digital Creative                 |
| V14 | Site names must be lowercase and formatted per CTT conventions (e.g., "nativetouch" not "Native-Touch").                                 | Error    | Digital Placement, Digital UTM   |

---

## 10. Dropdown Vocabularies

These are the valid values for each taxonomy field. They populate the Dropdown List tabs in the output and power the dropdowns in the app's tactic review table.

### Market

CA

### Product Names and Acronyms

| Full Name              | Acronym |
| ---------------------- | ------- |
| Non-Branded - HIV/AIDS | NON     |
| Gardasil 9             | GSL     |
| Capvaxive              | PCN     |

### Campaign Types

| Full Name  | Acronym |
| ---------- | ------- |
| Branded    | BRND    |
| UnBranded  | NON     |
| Co-Branded | CBRDN   |

### Objectives

| Full Name     | Acronym |
| ------------- | ------- |
| Awareness     | AW      |
| Consideration | CONSD   |
| Traffic       | TF      |
| Conversion    | CV      |

### Genders

| Full Name      | Acronym |
| -------------- | ------- |
| Female         | F       |
| Male           | M       |
| All            | A       |
| Non-Applicable | NA      |

### Age Demographics

18-26, 18-99, 20-26, 24-45, 25-44, 27-45, 30-45, 50-99

### Placements

CSTM, CTV, ISTR (In-Stream), AUN (Audio), IF (In-Feed), YTP (YouTube Pre-Roll), YTC (YouTube CTV)

### Tactic Types

CSTM, DEMO, BEH (Behavioral)

### Geo

| Full Name | Acronym |
| --------- | ------- |
| National  | NTL     |
| Local     | LCL     |

### Buy Types

CPM, CPC, CPA, CPCV, FLAT

### Content Purposes

| Full Name         | Acronym |
| ----------------- | ------- |
| Product Awareness | PRDAW   |
| Disease Awareness | DA      |
| Corporate         | COR     |

### Match Types (Search only)

| Full Name            | Acronym |
| -------------------- | ------- |
| Broad                | BROD    |
| Broad, Phase, Exact  | BPE     |
| Broad Match Modified | BMM     |
| Phrase               | PHRS    |
| Exact                | EXCT    |

### Ad Formats

| Full Name | Acronym |
| --------- | ------- |
| Image     | IMG     |
| Video     | VID     |
| Audio     | AUDIO   |
| Text      | TXT     |
| Custom    | CSTM    |
| Canvas    | CAN     |
| Native    | NAT     |

### Ad Dimensions

Common values: 300x250, 320x50, 728x90, 160x600, 1x1, 9x16, 1920x1080, 1920x1920, NA

### Provinces (Geo Targeting)

AB, BC, ON, QC, SK, MB, NB, NL, NS, PE, NA

### Sources (Social)

meta, tiktok, reddit, linkedin, pinterest, instagram

### Sources and Sites (Digital)

See Platform Mappings table in Section 7.

---

## 11. Row Explosion Logic

This is the combinatorial logic that determines how many taxonomy rows are generated from a single blocking chart tactic.

### For products with paired personas (Capvaxive):

```
Rows per tactic = pairs x languages x dimensions x assets
```

- Pairs: 2 (Harriet-Alma, Henri-Archie)
- Languages: from BC (typically EN and FR, so 2)
- Dimensions: from BC Formats column (e.g., 3 sizes)
- Assets: from promomats entries (e.g., 3 creative themes)
- Example: 2 x 2 x 3 x 3 = 36 rows per tactic

NO province explosion. Geo is always NTL, Province is always NA.

### For products with individual personas (Gardasil):

```
Rows per tactic = personas x provinces_per_language x languages x dimensions x assets
```

- Personas: selected in tactic review (e.g., 3: Sofia-Maya, Chris-Adam, Jamal)
- Provinces per language: EN has 3 (AB, BC, ON), FR has 1 (QC)
- Languages: from BC
- Dimensions: from BC or TBD
- Assets: from promomats entries
- Example for EN: 3 personas x 3 provinces x 1 lang x 1 dim x 1 asset = 9 rows
- Example for FR: 3 personas x 1 province x 1 lang x 1 dim x 1 asset = 3 rows
- Total: 12 rows per tactic

### Deduplication

Before writing output, deduplicate rows where the Ad Set / Placement string is identical. Multiple identical ad sets with different creatives are valid (different promomats IDs or dimensions). But identical ad set + identical ad is a duplicate.

---

## 12. UI/UX Requirements

### Design direction

Clean, utilitarian, professional. This is an internal tool for media planners who will use it weekly. Prioritize clarity and speed over visual flair. Think "well-designed form tool" not "marketing landing page."

- Light theme, high contrast
- Clear step indicators (Step 1 of 5, Step 2 of 5, etc.)
- Generous spacing in tables and forms
- Color-coded validation: green for valid, amber for warnings, red for errors
- Monospace font for taxonomy strings (they need to be scannable character-by-character)
- Mobile is not a priority (planners use desktop)

### Key interactions

- File upload: drag-and-drop with visual feedback (border highlight, file name display)
- Form inputs: standard inputs with labels above, validation on blur
- Tactic table: horizontally scrollable, sticky first column (platform name), zebra striping
- String preview: click-to-copy on any taxonomy string (copies to clipboard with toast confirmation)
- Download button: large, prominent, disabled until validation passes with zero errors

### Error states

- Upload failure: "Could not read the blocking chart. Please ensure it is a valid .xlsx file with a tab named 'Blocking Chart' or containing tactic/platform data."
- No tactics found: "No digital tactics were found in this blocking chart. The app supports: META, TIKTOK, DV360, YOUTUBE, SPOTIFY, GOOGLE SEARCH, and [list others]. Check that your blocking chart contains these platforms."
- Validation errors: shown inline on affected rows, with a summary count at the top of the preview

### Performance

- BC parsing should complete in under 2 seconds for files up to 5MB
- Taxonomy generation should complete in under 1 second for up to 500 tactic rows
- Excel output generation should complete in under 3 seconds

---

## 13. Formatting Requirements for Output Excel

### Header row styling

- Bold text
- Light blue background fill (#D5E8F0)
- Borders on all cells
- Freeze panes on row 1 (headers stay visible while scrolling)

### Data row styling

- Normal weight text
- Alternating row colors (white / light gray #F5F5F5) for readability
- Auto-fit column widths where possible

### Dropdown List tabs

- Same header styling as taxonomy tabs
- Each column lists valid values vertically starting from row 2
- Column headers match the taxonomy tab column names

### Cell formatting

- Year & Month cells: number format (plain, not date)
- Date cells (Start date, End Date): date format MM/DD/YYYY
- All taxonomy string cells: text format (prevent Excel from interpreting them as formulas or dates)

---

## 14. Edge Cases and Known Issues

### Dimension normalization

- Ratios like "1:1" must be converted to "1x1"
- "9:16" becomes "9x16"
- "16:9" becomes "16x9"
- If no dimensions are available from the BC, default to "TBD"

### Ad format heuristics

The app infers ad format from dimensions when the planner does not specify:

- Dimensions containing "1920" or "1080" in either axis: default to VID
- Dimensions "1x1" or "9x16" or "4x5": ambiguous, could be IMG or VID. Default to IMG but flag as a warning.
- Dimensions "30s" or "60s" or containing "sec": AUDIO
- All other standard banner sizes (300x250, 728x90, 320x50, 160x600): IMG

The planner can override ad format per row in the tactic review table.

### Objective mapping from BC KPI

The BC's KPI column sometimes contains campaign objectives ("Awareness", "Traffic") and sometimes contains performance metrics ("CPM", "CTR", "CPA"). The app should:

1. First, try to map the value directly (Awareness -> AW, Traffic -> TF, etc.)
2. If the value is a metric (CPM, CTR, CPA, etc.), do NOT map it. Leave the Objective field as "TBD" and require the planner to select it in the form.
3. Never auto-map a buy type metric to an objective code.

### Multi-language handling

- "EN/FR" in the BC Language column means generate separate rows for each language
- FR rows for Capvaxive use the French Promomats ID (separate from EN)
- FR province is always QC; EN provinces are AB, BC, ON (and QC for Gardasil)

### Influencer campaigns

- When the planner marks a social tactic as "Influencer" in the review table, Custom Tag 1 changes to "Social+Influencer"
- The influencer name appears as Custom Tag 3 in the Ad string and is appended to the Ad Set string after Language+Province

### Empty/TBD values

- Promomats IDs left blank should output as "TBD" in the taxonomy strings
- Creative Names left blank should output as "na" (lowercase)
- The app should visually distinguish TBD values (gray italic text) from filled values

---

## 15. Future Enhancements (Out of Scope for V1)

These are documented for context but should NOT be built in V1:

1. **Diff mode**: Compare generated taxonomy against an existing filled traffic sheet to highlight discrepancies
2. **Persona extraction from BC targeting column**: Auto-detect persona names from the Gardasil BC's Targeting column instead of requiring manual selection
3. **SharePoint creative file integration**: Parse creative file exports to auto-populate Promomats IDs
4. **Multi-campaign support**: Process multiple blocking charts in one session
5. **Template versioning**: Support different traffic sheet template versions as the client evolves their requirements
6. **Admin panel**: Allow non-developers to update platform mappings and product configs without code changes
