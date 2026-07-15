# ATPL Practice Quiz

Static quiz site — no build step. Deploy the whole folder to GitHub Pages, or run it locally with the launchers below.

## Run locally

Browsers block loading data from `file://`, so use a local web server:

| Platform | Action |
| -------- | ------ |
| **Windows** (Python installed) | Double-click `Windows/clicktostart.bat` |
| **Windows** (no Python) | Double-click `Windows/install_python_then_start.bat` |
| **macOS** | Double-click `macOS/clicktostart.command` |
| **Linux / terminal** | `chmod +x macOS/clicktostart.sh && ./macOS/clicktostart.sh` |

Opens at `http://localhost:8000/index.html`. Press **Ctrl+C** in the terminal to stop.

## Deploy (GitHub Pages)

1. In the repo on GitHub: **Settings → Pages → Build and deployment → Source** → **GitHub Actions**.
2. Push to `main` (or run **Actions → Deploy to GitHub Pages → Run workflow**).

The workflow is `.github/workflows/pages.yml`. It uploads this folder as a static site (no build step).

Live site: https://bunny-slayer.github.io/atplwebquiz/

## Folder layout

```
atplwebquiz/
├── index.html          Site shell
├── script.js           Quiz logic
├── styles.css          Theme
├── data/
│   ├── manifest.json   Subject catalog
│   └── 010-air-law.csv Question bank (781 rows)
├── Windows/            Local launchers (Windows)
└── macOS/              Local launchers (macOS / Linux)
```

## Updating questions

Question banks live in `data/*.csv`. To regenerate Air Law from the source PDF, run these from the repo root (`atplnotes/`):

```bash
python scripts/parse_all.py
python scripts/generate_excel.py
```

That updates `airlaw/ATPL_Air_Law_Questions.xlsx` and `atplwebquiz/data/010-air-law.csv`.

To add or refresh a subject from Evionica Excel banks:

```bash
python scripts/import_evionica.py Human.xlsx
python scripts/import_evionica.py Airframe.xlsx
python scripts/import_evionica.py Instrument.xlsx
```

That writes `atplwebquiz/data/<subject>.csv` and updates `data/manifest.json`.
