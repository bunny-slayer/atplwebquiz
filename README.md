# ATPL Air Law Quiz — `atplwebquiz`

A self-contained quiz site that loads its 781-question bank from
`questions.csv` at runtime. No build step is needed.

The folder also includes `ATPL_Air_Law_Questions.xlsx` and
`update_questions_from_excel.py` so the question bank can be edited and
regenerated from inside this folder before zipping or sharing it.

## Run it

Modern browsers block `fetch()` on `file://` URLs for security, so the page
needs a tiny local web server. The launchers are sorted into platform
folders so it's obvious where to click:

```
atplwebquiz/
├── Windows/        ← Windows users open this folder
└── macOS/          ← Mac (and Linux) users open this folder
```

- **Windows, no Python installed** — open the `Windows` folder and
  double-click `install_python_then_start.bat`. It installs Python
  automatically, then opens the quiz.
- **Windows, Python already installed** — open the `Windows` folder and
  double-click `clicktostart.bat`. Your default browser will open at
  `http://localhost:8000/index.html`.
- **macOS one-click** — open the `macOS` folder and double-click
  `clicktostart.command`. It tries Python first, then Ruby, and opens the
  quiz in your browser.
- **Linux / Terminal** — open the `macOS` folder and run
  `chmod +x clicktostart.sh && ./clicktostart.sh`.

Each launcher steps up to the website folder before starting
`python -m http.server 8000`, so `questions.csv`, `index.html`, and the rest
stay where they are. Stop the server with **Ctrl+C** in the console.

If you prefer to use any other static-file server (Live Server in VS Code,
`npx serve`, `php -S`, etc.) just point it at this `atplwebquiz` folder.

## Use the site

1. **Home page** — tick the sections you want to practise (one, several, or
   all of them via *Select all* / *Clear*), set how many questions you want
   (10 / 25 / 50 / 100 / All / custom), and start.
2. **Quiz page** — click a choice and press **Submit answer**. The page locks
   the choices, marks the correct one green, and your wrong pick (if any) red.
   Click **Next question** to move on.
3. **Summary page** — at the end you get totals (correct, wrong, percentage)
   plus a list of every question you got wrong with both your answer and the
   correct answer. Click **Practice my wrong answers** to immediately re-quiz
   only the questions you missed.

The top bar always shows your live score and progress (e.g. *Correct 12 |
Wrong 3 | 16 / 50*).

## How questions are stored

`questions.csv` has one row per question with these columns:

| Column          | Meaning                                              |
| --------------- | ---------------------------------------------------- |
| Section         | Topic (e.g. *Rules of the Air – Part 2*)             |
| QuestionID      | Source ID, e.g. `010.07 Part 1 Q0017`                |
| Question        | Question stem                                        |
| ChoiceA…ChoiceD | The four answer options                             |
| CorrectAnswer   | Must equal one of ChoiceA–ChoiceD                    |
| Source          | `PDF` (choices from the original document) or `Synthesized` (auto-generated distractors — review before relying) |

The site filters out any row where the `CorrectAnswer` doesn't match one of
the four choices, so the data stays consistent.

### Updating the bank

The website reads `questions.csv`; it does not read the Excel file directly.
You can edit `questions.csv` directly (Excel, VS Code, anything), save, and
refresh the browser.

For a friendlier editing workflow, edit `ATPL_Air_Law_Questions.xlsx` in this
folder, then regenerate `questions.csv` from it:

```bash
python update_questions_from_excel.py
```

That updater needs Python with `openpyxl` installed:

```bash
python -m pip install openpyxl
```

You do **not** need `parse_all.py`, `generate_excel.py`, or
`parsed_questions.json` in the zipped website folder. Those are source/build
files for recreating the workbook from the original PDF; the website itself
only needs the files listed below.

## Sharing As A Zip

Zip the whole `atplwebquiz` folder and send it. The recipient should unzip
it somewhere normal (Desktop or Documents), then:

1. **Windows users** — open the `Windows` subfolder and read
   `READ_ME_FIRST.txt`. They double-click either
   `install_python_then_start.bat` (if they do not have Python) or
   `clicktostart.bat` (if they already do).
2. **macOS users** — open the `macOS` subfolder and read
   `READ_ME_FIRST.txt`. They double-click `clicktostart.command`.
3. Do not move `questions.csv`, `index.html`, or any other top-level file
   out of the `atplwebquiz` folder. The launchers expect to find them by
   stepping up one folder.

If macOS says `clicktostart.command` cannot be opened after unzipping, open
Terminal in the `macOS` folder and run this once:

```bash
chmod +x clicktostart.command
```

Then double-click `clicktostart.command` again.

## Files

```
atplwebquiz/
├── index.html                    - All three views (home, quiz, summary)
├── styles.css                    - Theme + layout
├── script.js                     - CSV loader, quiz state machine, summary
├── questions.csv                 - The question bank (781 rows)
├── ATPL_Air_Law_Questions.xlsx   - Editable workbook copy
├── update_questions_from_excel.py - Regenerates questions.csv from the workbook
├── README.md                     - This file
├── Windows/
│   ├── READ_ME_FIRST.txt
│   ├── clicktostart.bat              - Launches the quiz when Python is installed
│   └── install_python_then_start.bat - Installs Python first, then launches
└── macOS/
    ├── READ_ME_FIRST.txt
    ├── clicktostart.command          - macOS double-click launcher
    └── clicktostart.sh               - macOS / Linux terminal launcher
```
