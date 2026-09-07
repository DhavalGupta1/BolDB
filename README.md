# BolDB — "Speak to your Database"
> **AI-Powered Natural Language Database Management Platform**

BolDB is an intelligent, privacy-first database management web application. Users can upload their database (or CSV files), query or modify it in plain natural language powered by Google Gemini, visualize results with interactive charts, safely mutate records with snapshot rollbacks, and download the modified database file back anytime.

---

## Key Features

- **🔒 100% Client-Side Privacy**: Runs an embedded SQLite WebAssembly engine (`sql.js`) in your browser. Your database records never leave your machine — only table schemas are sent to Gemini to generate SQL.
- **🗣️ "Bol" AI Studio**: Convert natural language requests into optimized SQLite queries (e.g. *"Show top 5 customers with highest total spend"*, *"Count products by category and average price"*).
- **📊 Auto-Chart Visualizer**: Automatically detects when queries produce categorical/numeric aggregations and renders interactive Bar, Line, or Pie charts.
- **✏️ Interactive Data Grid & Inline Editing**: Paginated results table with column sorting, live search filtering, CSV export, and direct double-click inline cell editing.
- **🛡️ Mutation Safeguards & Rollbacks**: Prompts for confirmation on `INSERT`, `UPDATE`, `DELETE`, or `DROP` queries with automatic snapshots so you can **Undo Mutation** at any time.
- **📥 Instant Upload & Download**: Drag-and-drop `.db`, `.sqlite`, `.sqlite3`, or `.csv` files. Click **Download DB** anytime to save the updated SQLite database binary.
- **⚡ Built-in Sample Datasets**: Instant 1-click exploration of pre-loaded **E-Commerce Store** and **SaaS Metrics** databases.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Bespoke Vanilla CSS with modern tokens, dark mode, glassmorphism, and responsive design
- **Database**: SQLite WebAssembly (`sql.js`)
- **AI Engine**: Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-pro`)
- **Visualizations**: Recharts
- **Icons**: Lucide React
- **CSV Ingestion**: PapaParse

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Connect Your Gemini API Key (Optional for Custom Queries)
- Click **Connect Key** in the top navigation bar.
- Paste your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
- Select your preferred model (`Gemini 2.5 Flash` recommended).
- The key is saved strictly in your browser's local storage.

### 4. Build for Production
```bash
npm run build
npm run preview
```
