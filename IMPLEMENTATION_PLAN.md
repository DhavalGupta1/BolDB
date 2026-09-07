# BolDB — Implementation Plan & System Architecture
> **"Speak to your Database" — An AI-Powered Natural Language Database Management Platform**

---

## 1. Executive Summary

**BolDB** is an intelligent, client-first database management web platform that bridges the gap between natural human language and relational databases. 

Users can upload an existing database (SQLite `.db`, `.sqlite`, `.sqlite3`) or tabular data (`.csv`), explore its structure, and interact with it conversationally using natural language prompts. Powered by Google Gemini, BolDB translates plain language prompts into accurate, optimized SQL queries, executes them instantly against the loaded database, visualizes the results through rich interactive grids and charts, allows safe data modifications, and lets users download the updated database file back to their machine at any time.

---

## 2. Core Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client [BolDB Frontend (Browser / WASM)]
        Upload[Upload .db / .sqlite / .csv] --> WASM[(SQLite WASM Engine)]
        Sample[Load Sample DB] --> WASM
        WASM --> SchemaExtractor[Schema Introspector]
        
        UI_Prompt[Natural Language Prompt] --> PromptEngine[Prompt & Context Builder]
        SchemaExtractor --> PromptEngine
        
        PromptEngine --> GeminiAPI[Google Gemini API]
        GeminiAPI --> SQLResponse[Generated SQL + Explanation]
        
        SQLResponse --> SafetyChecker{Mutation Check}
        SafetyChecker -- Read Query (SELECT) --> WASM
        SafetyChecker -- Mutation (UPDATE/INSERT/DELETE) --> ConfirmModal[User Confirmation & Preview]
        ConfirmModal -- Confirmed --> WASM
        
        WASM --> ResultsView[Interactive Data Grid & Visualizer]
        WASM --> Downloader[Export / Download Updated .sqlite File]
    end
```

### Key Architectural Advantage: Privacy-First Client Execution
1. **Zero Data Leakage**: The actual database records **never leave the user's browser**. The SQLite engine runs entirely client-side via WebAssembly (`sql.js` / `@sqlite.org/sqlite-wasm`).
2. **Schema-Only AI Context**: Only the table schema (table names, column definitions, data types, and primary/foreign keys) is provided to the Gemini API to construct the SQL query.
3. **Zero Latency & No Server Cost**: Queries run with native SQLite speed locally in memory. Database updates are instantaneous, and modified databases can be saved and downloaded with one click.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **React 18 + TypeScript + Vite** | Fast, reactive, modern single-page web application |
| **Database Engine** | **SQLite WASM (`sql.js`)** | In-browser full SQLite relational database engine |
| **Styling & Design** | **Tailwind CSS + Custom CSS Variables** | Modern, responsive dark-mode glassmorphic interface |
| **Icons & Visuals** | **Lucide Icons** | Clean, minimalist iconography |
| **AI Integration** | **Google Gen AI SDK (`@google/genai`)** | Communication with Gemini 1.5 Flash / Pro models |
| **Data Tables** | **Custom Paginated Virtual Data Grid** | High-performance table with sorting, search, and inline cell editing |
| **Data Visualization** | **Chart.js / Recharts** | Automatic bar, line, and pie charts for aggregated query results |
| **Code / SQL Display**| **PrismJS / Monaco-style viewer** | Syntax-highlighted SQL with copy & direct manual edit capability |

---

## 4. Key Feature Breakdown

### 4.1 Database Ingestion & Management
- **File Upload Support**: Drag-and-drop or file picker for `.db`, `.sqlite`, `.sqlite3`, and `.csv` files.
- **CSV to SQLite Converter**: Automatically parses CSV headers and rows, detects data types (TEXT, INTEGER, REAL), creates tables, and bulk inserts the data.
- **One-Click Sample Datasets**: Built-in templates for instant testing:
  - *E-Commerce Store* (`customers`, `orders`, `products`, `order_items`)
  - *SaaS Metrics* (`users`, `subscriptions`, `invoices`, `events`)
  - *Employee & Payroll* (`departments`, `employees`, `salaries`)
- **Database Exporter**: One-click download of the active SQLite database binary (`.sqlite`), export results to CSV, or export SQL schema dump.

### 4.2 Schema Introspection & Database Explorer
- Left sidebar showing all tables with live row counts.
- Click any table to inspect column names, primary keys, data types, and foreign key relations.
- Quick action buttons: *Preview 50 rows*, *View Schema*, *Drop Table*, *Create Table*.

### 4.3 "Bol" Natural Language to SQL Studio
- **Prompt Bar**: Conversational input for queries like:
  - *"Show me top 5 customers with total spend over $500"*
  - *"Which product category has the lowest average rating?"*
  - *"Update all electronics prices by increasing them 10%"*
  - *"Add a new employee named Alex in the Engineering department with salary 85000"*
- **Schema-Aware System Prompt**: Feeds Gemini the exact table definitions and dialect rules (SQLite syntax, date functions, aggregations).
- **Dual Output**: Returns both the executable SQL code and an plain English explanation of what the query does and how it works.
- **Manual Override**: Users can freely edit the generated SQL before executing it, or write raw SQL directly.

### 4.4 Data Mutation & Safety Safeguards
- **Query Classification**: Distinguishes between read operations (`SELECT`, `PRAGMA`) and mutation operations (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`).
- **Confirmation & Safety Guard**: Destructive queries require explicit user confirmation with a summary of affected records.
- **Undo / Snapshot Capability**: Ability to capture state snapshots before running batch updates to revert if an unintended mutation occurs.

### 4.5 Interactive Results & Auto-Charting
- **Smart Data Grid**:
  - Pagination, column sorting, global search.
  - Inline row editing for manual data modifications.
  - Column type indicators (Number, String, Date, Boolean).
- **Auto-Visualizer**:
  - Detects when query output contains label + numeric columns (e.g., `category, total_sales`).
  - Automatically recommends and displays interactive Bar, Line, or Pie charts.

---

## 5. UI & Design System

- **Visual Theme**: Deep space slate (`#0B0F19`) with glowing indigo/cyan accents (`#6366F1`, `#06B6D4`), frosted glass panels (`backdrop-blur-md`), and subtle micro-interactions.
- **Typography**: Modern font stack (`Inter` / `Outfit` from Google Fonts).
- **Layout Structure**:
  - **Top Navbar**: BolDB logo, current DB status/size, API key settings, "Download Database" action button.
  - **Left Sidebar**: Tables list, column schemas, quick preview, sample datasets loader.
  - **Center Workspace**:
    - **Header**: Active database summary & table statistics.
    - **AI Prompt Bar ("Bol")**: Large, prominent conversational input with suggestion chips.
    - **Query Panel**: Generated SQL viewer, copy button, explanation card, execution timer.
    - **Results Tab**: Data grid view vs. Chart visualization tab.

---

## 6. Implementation Milestones

```
Milestone 1: Project Scaffolding & Design System
├── Vite + React + TypeScript setup
├── Tailwind CSS configuration with dark theme & glassmorphic design tokens
└── Layout components (Navbar, Sidebar, Main Workspace, Modals)

Milestone 2: SQLite Engine & File Management
├── Integration of sql.js (WebAssembly SQLite)
├── Database file loader (Uint8Array to SQLite DB)
├── CSV file parser and table creator
├── Database export and download (.sqlite generator)
└── Pre-loaded sample databases (E-commerce, SaaS)

Milestone 3: Schema Introspection & Database Explorer
├── SQLite master table querying (`sqlite_master`, `PRAGMA table_info`)
├── Sidebar schema visualizer with live counts and column tags
└── Quick-query presets ("SELECT * FROM table LIMIT 50")

Milestone 4: Gemini Natural Language to SQL Integration
├── API Key configuration modal (stored securely in browser localStorage)
├── Prompt construction with schema context injection
├── Gemini API client (`gemini-2.5-flash` / `gemini-1.5-pro`)
└── SQL parsing, syntax highlighting, and query explanation display

Milestone 5: Execution, Safety, & Data Mutation
├── Query execution pipeline with error handling
├── Mutation detection (`INSERT`, `UPDATE`, `DELETE`, `DROP`)
├── Safety confirmation dialog with rollback snapshot
└── Direct manual SQL terminal mode

Milestone 6: Interactive Data Grid & Visualizations
├── High-performance paginated table with sorting and filtering
├── Inline cell editing directly writing back to the SQLite WASM instance
├── Auto-chart generator (Bar, Line, Pie) for analytical queries
└── Export query results to CSV

Milestone 7: Polish, Verification, & Documentation
├── End-to-end testing with various SQLite databases & CSVs
├── Responsive UI tuning and accessibility checks
└── Comprehensive README & user guide
```

---

## 7. Security, Privacy & Reliability

1. **Client-Side Isolation**: The user's database records are processed locally in browser memory. No external server receives user rows.
2. **API Key Safety**: The Gemini API key is stored only in the user's browser `localStorage` and sent directly to Google's API endpoints over TLS.
3. **Error Resilience**: SQL errors from bad queries are gracefully caught and reported back to Gemini for self-correction / user feedback.
4. **Data Integrity**: Downloaded databases are binary-compatible standard SQLite 3 files, readable by any SQLite tool (DBeaver, TablePlus, Python, etc.).
