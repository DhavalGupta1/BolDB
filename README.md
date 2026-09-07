# 🗣️ BolDB — Speak to Your Database
> **An AI-Powered Natural Language Database Management Platform**

BolDB (*"Bol"* meaning *"Speak"* in Hindi) bridges the gap between natural human conversation and relational databases. It allows anyone — from business analysts to software engineers — to upload a database, ask questions or request updates in plain English, and have Google Gemini translate those prompts into optimized SQLite queries executed instantly inside your browser.

---

## 📑 Table of Contents
1. [Key Features & Highlights](#-key-features--highlights)
2. [Architecture & Privacy Guarantee](#-architecture--privacy-guarantee)
3. [Prerequisites](#-prerequisites)
4. [Step-by-Step Installation](#-step-by-step-installation)
5. [How to Start the Project](#-how-to-start-the-project)
6. [How to Stop / End the Project](#-how-to-stop--end-the-project)
7. [How to Work with BolDB (Complete User Guide)](#-how-to-work-with-boldb-complete-user-guide)
   - [1. Connecting a Database or CSV](#1-connecting-a-database-or-csv)
   - [2. Setting up your Gemini API Key](#2-setting-up-your-gemini-api-key)
   - [3. Asking Questions in Natural Language ("Bol AI Studio")](#3-asking-questions-in-natural-language-bol-ai-studio)
   - [4. Inspecting & Manually Editing SQL](#4-inspecting--manually-editing-sql)
   - [5. Interactive Data Grid & Inline Cell Editing](#5-interactive-data-grid--inline-cell-editing)
   - [6. Visualizing Query Results (Auto-Charts)](#6-visualizing-query-results-auto-charts)
   - [7. Safe Data Mutations & Rollbacks](#7-safe-data-mutations--rollbacks)
   - [8. Downloading the Updated Database](#8-downloading-the-updated-database)
8. [Project Structure](#-project-structure)
9. [Troubleshooting & FAQ](#-troubleshooting--faq)
10. [Tech Stack](#-tech-stack)

---

## ✨ Key Features & Highlights

- **🔒 100% Client-Side Privacy**: Runs an embedded SQLite WebAssembly engine (`sql.js`). Your raw database records **never leave your device** — only table schema definitions are passed to Gemini to generate queries.
- **⚡ Native WebAssembly Speed**: Executes SQL queries in `0 - 2 ms` directly in browser memory.
- **🗣️ "Bol" AI Studio**: Convert natural language questions into accurate, high-performance SQLite SQL queries with human-readable explanations.
- **🛠️ Self-Correcting SQL**: Automatically repairs SQL queries with Gemini if a syntax or constraint error occurs.
- **📊 Auto-Chart Visualizer**: Detects analytical queries and automatically renders interactive Bar, Line, or Pie charts.
- **✏️ Interactive Data Grid & Inline Editing**: Paginated tables with live search, column sorting, CSV export, and double-click inline cell edits.
- **🛡️ Mutation Safety & Instant Undo**: Prompts for confirmation before applying destructive operations (`UPDATE`, `DELETE`, `DROP`) and provides instant snapshot rollbacks.
- **📥 One-Click Export**: Download the modified database back to your computer as a standard `.sqlite` file anytime.
- **🚀 Built-in Sample Datasets**: Includes pre-loaded **E-Commerce Store** and **SaaS Metrics** databases for immediate 1-click testing.

---

## 🏛️ Architecture & Privacy Guarantee

```
┌────────────────────────────────────────────────────────┐
│             User's Browser (BolDB Client)             │
│                                                        │
│   Uploaded File (.db / .sqlite / .csv)                 │
│         │                                              │
│         ▼                                              │
│   SQLite WebAssembly Engine (sql.js) ─────────────┐    │
│         │                                         │    │
│         │ Introspects Schema Only                 │    │
│         │ (Table Names & Column Types)            │    │
│         ▼                                         │    │
│   Prompt & Context Builder                        │    │
│         │                                         │    │
└─────────┼─────────────────────────────────────────┼────┘
          │ Schema Context                          │
          ▼                                         │
┌────────────────────────┐                          │
│   Google Gemini API    │                          │
│   (TLS Encrypted)      │                          │
└─────────┬──────────────┘                          │
          │ Generated SQL + Explanation             │
          ▼                                         │
┌───────────────────────────────────────────────────┼────┐
│         ▼                                         ▼    │
│   Mutation Checker ───[Read Query (SELECT)]──► Execute │
│         │                                              │
│         └───[Mutation (UPDATE/DELETE)]─► User Confirm  │
│                                                        │
│   Interactive Data Grid & Visualizer (Recharts)        │
│   Download Updated .sqlite Binary                      │
└────────────────────────────────────────────────────────┘
```

> **Why This Matters:** Traditional cloud database tools require uploading your sensitive business or personal records to a third-party server. BolDB processes everything inside your browser's WebAssembly sandbox. Your actual records are never exposed to any server.

---

## 💻 Prerequisites

Ensure you have the following installed on your computer:
- **Node.js**: `v18.0.0` or higher (recommended: `v20+` or `v24+`)
- **npm**: `v9.0.0` or higher (comes bundled with Node.js)
- **Modern Web Browser**: Chrome, Edge, Firefox, Brave, or Safari with WebAssembly support.

Check your versions by running:
```bash
node -v
npm -v
```

---

## 📦 Step-by-Step Installation

1. **Open your terminal** (PowerShell, Command Prompt, or Bash) and navigate to the project directory:
   ```bash
   cd c:\Users\walki\Desktop\BolDB
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   *This will install React 18, Vite, TypeScript, `sql.js` (SQLite WASM), `@google/genai`, `recharts`, `lucide-react`, and `papaparse`.*

---

## 🚀 How to Start the Project

### Development Mode (Recommended)
To run the live development server with hot-module reloading:
```bash
npm run dev
```

Once running, the terminal will show:
```
  VITE v8.2.2  ready in 200 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

👉 **Open your browser and navigate to:** [`http://localhost:5173/`](http://localhost:5173/)

---

### Production Build & Preview
To test the optimized production build:
```bash
# 1. Build the production bundle
npm run build

# 2. Preview the built application locally
npm run preview
```

---

## 🛑 How to Stop / End the Project

When you are done working on BolDB:

### 1. In your Terminal / Command Prompt:
- Press `Ctrl + C` (or `Cmd + C` on macOS).
- When prompted: `Terminate batch job (Y/N)?`, press `Y` and hit `Enter`.

### 2. If running as a background task in Windows PowerShell:
To find and kill the running process on port 5173:
```powershell
# Find process using port 5173
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
```

---

## 📖 How to Work with BolDB (Complete User Guide)

### 1. Connecting a Database or CSV
- **Upload Existing SQLite Database**: Click **"Upload / CSV"** in the top navbar or drag & drop any `.db`, `.sqlite`, or `.sqlite3` file. BolDB loads it into browser memory immediately.
- **Import CSV Spreadsheets**: Drop any `.csv` file. BolDB parses the rows, detects column data types (`INTEGER`, `REAL`, `TEXT`), creates a new table, and bulk inserts all data.
- **Try Preset Sample Databases**: Click **"🛒 E-Commerce"** or **"⚡ SaaS"** in the top navbar for immediate exploration without needing a file.
- **Start a Blank Database**: Click **"Upload / CSV"** > **"Or start with a blank database"**.

---

### 2. Setting up your Gemini API Key
1. Click the **"Connect Key"** (or **"Gemini Key"**) button in the top navbar.
2. If you don't have an API key, click the link: [Get a Free API Key from Google AI Studio](https://aistudio.google.com/app/apikey).
3. Paste your key (starts with `AIzaSy...`).
4. Select your model:
   - `Gemini 2.5 Flash` *(Recommended — Fastest & free-tier eligible)*
   - `Gemini 1.5 Pro` *(Best for deeply nested schemas and multi-table joins)*
5. Click **"Test Key"** to verify connectivity with Google.
6. Click **"Save Configuration"**.
*(Note: BolDB also comes with an offline demo mode that handles common queries even without an API key).*

---

### 3. Asking Questions in Natural Language ("Bol AI Studio")
In the **Bol AI Studio** prompt bar at the top of the workspace:
- Type your question in plain English, for example:
  - *"Show me top 5 customers with orders over $100"*
  - *"Count products by category and average price"*
  - *"Which accounts have unpaid invoices?"*
  - *"Increase prices by 10% for Electronics category"*
  - *"Show all orders placed in the last 30 days grouped by status"*
- Press `Enter` or click **"Generate"**.
- Gemini inspects your schema and translates your question into an optimized SQLite statement.

---

### 4. Inspecting & Manually Editing SQL
Under the prompt bar, the **Generated SQL Statement** panel shows:
- The exact SQL query generated.
- A concise English explanation of what the query does.
- The execution duration in milliseconds (e.g., `1 ms`).
- **"Edit SQL"**: Click to modify the SQL manually before re-running.
- **"Copy"**: Copy the query to your clipboard.
- **"Auto-Fix with Gemini"**: If a query encounters an error, this button appears automatically to self-repair the query with AI.

---

### 5. Interactive Data Grid & Inline Cell Editing
- **Sort**: Click any column header to sort ascending or descending.
- **Search**: Type in the *"Filter results..."* search box to search across all rows.
- **Pagination**: Switch between 10, 15, 25, 50, or 100 rows per page.
- **Inline Cell Editing**: Double-click on any cell (or click the edit pencil icon), type the new value, and press `Enter` (or click the checkmark). The value is updated directly in the SQLite database instance!
- **Export to CSV**: Click the **"Export CSV"** button above the table to download the current result set as a CSV file.

---

### 6. Visualizing Query Results (Auto-Charts)
- When a query contains a label column (e.g., `category`, `status`, `country`) and a numeric metric (e.g., `count`, `price`, `revenue`), BolDB automatically switches to the **"Visualizer"** tab.
- Toggle between **Bar Chart**, **Line Chart**, and **Pie Chart** views.
- Hover over bars or slices to view exact values in interactive tooltips.
- Switch back to the **"Data Grid"** tab at any time.

---

### 7. Safe Data Mutations & Rollbacks
- When a query contains `INSERT`, `UPDATE`, `DELETE`, or `DROP`, BolDB prevents accidental data loss:
  1. A **"Confirm Database Mutation"** modal appears, displaying the query and the expected impact.
  2. BolDB takes an automatic snapshot of your database in memory.
  3. If you want to revert the mutation, click the **"Undo Mutation"** button in the top navbar to roll back to the previous snapshot.

---

### 8. Downloading the Updated Database
Whenever you want to save your changes back to your local computer:
- Click the **"Download DB"** button in the top navbar.
- BolDB exports the active SQLite binary directly to your downloads folder as `<database_name>.sqlite`.
- This file is 100% compatible with any standard SQLite viewer (e.g., TablePlus, DBeaver, DB Browser for SQLite, or Python `sqlite3`).

---

## 📂 Project Structure

```
BolDB/
├── index.html                  # HTML entry point with Google Fonts & metadata
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite bundler configuration (WASM & CSS isolated)
├── postcss.config.js           # PostCSS configuration
├── IMPLEMENTATION_PLAN.md      # Comprehensive architecture & milestone plan
├── README.md                   # This documentation guide
├── public/
│   └── sql-wasm.wasm           # SQLite WebAssembly binary (sql.js)
└── src/
    ├── main.tsx                # React application bootstrap
    ├── App.tsx                 # Core app state & coordinator
    ├── index.css               # Design system: dark mode, glassmorphic styles
    ├── types/
    │   └── database.ts         # TypeScript definitions for schemas & queries
    ├── services/
    │   ├── sqliteService.ts    # SQLite WASM engine, CSV ingestion, snapshots
    │   └── geminiService.ts    # Gemini API client, NL-to-SQL & auto-repair
    └── components/
        ├── Navbar.tsx          # Top bar, DB info, sample picker, download button
        ├── Sidebar.tsx         # Schema explorer, table cards, quick preview
        ├── PromptBar.tsx       # "Bol" conversational NL prompt bar
        ├── QueryInspector.tsx  # SQL viewer, explanation, edit & auto-fix
        ├── DataGrid.tsx        # Interactive table, inline cell editing, CSV export
        ├── Visualizer.tsx      # Auto-charting (Bar, Line, Pie) with Recharts
        ├── FileUploadModal.tsx # Drag-and-drop .db/.sqlite/.csv file uploader
        ├── ApiKeyModal.tsx     # Gemini API key setup, testing & privacy notes
        └── MutationModal.tsx   # Safety confirmation dialog for mutations
```

---

## ❓ Troubleshooting & FAQ

### Q: Does BolDB upload my database to the cloud?
**A:** No. Your database is loaded exclusively into your browser's WebAssembly memory. Only table definitions (table names and column types) are sent to Gemini to generate SQL queries.

### Q: What file formats can I upload?
**A:** BolDB supports SQLite database files (`.db`, `.sqlite`, `.sqlite3`) and spreadsheet files (`.csv`).

### Q: Why do I see "Port 5173 is in use"?
**A:** Another instance of Vite is already running. You can run `npm run dev -- --port 5174` or terminate the existing process using the command in [How to Stop / End the Project](#-how-to-stop--end-the-project).

### Q: Do I need a paid Gemini API key?
**A:** No. Google AI Studio offers a generous free tier for `Gemini 2.5 Flash` and `Gemini 1.5 Flash` that works seamlessly with BolDB.

---

## 🛠️ Tech Stack

- **UI Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Database Engine**: [SQLite WebAssembly (`sql.js`)](https://sql.js.org/)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/)
- **Charts & Graphs**: [Recharts](https://recharts.org/)
- **CSV Ingestion**: [PapaParse](https://www.papaparse.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Bespoke Vanilla CSS Design System (Glassmorphic Dark Theme)

---

## 📄 License
This project is open-source and available under the **MIT License**.
