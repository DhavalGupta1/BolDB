import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { TableSchema, ColumnInfo, QueryResult, DatabaseMetadata } from '../types/database';

class SqliteService {
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private dbMetadata: DatabaseMetadata = {
    name: 'Untitled.sqlite',
    sizeBytes: 0,
    tableCount: 0,
    loadedAt: new Date(),
    isDirty: false,
  };
  private snapshotHistory: Uint8Array[] = [];

  // Initialize SQLite WASM
  async init(): Promise<void> {
    if (this.SQL) return;
    this.SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl,
    });
  }

  isInitialized(): boolean {
    return this.SQL !== null && this.db !== null;
  }

  getMetadata(): DatabaseMetadata {
    return { ...this.dbMetadata };
  }

  // Load an existing database from buffer
  async loadFromBuffer(buffer: ArrayBuffer, fileName: string): Promise<void> {
    await this.init();
    if (!this.SQL) throw new Error('Failed to initialize SQLite engine');

    const uInt8Array = new Uint8Array(buffer);
    this.db = new this.SQL.Database(uInt8Array);
    this.snapshotHistory = [this.db.export()];

    this.dbMetadata = {
      name: fileName,
      sizeBytes: buffer.byteLength,
      tableCount: 0,
      loadedAt: new Date(),
      isDirty: false,
    };

    const schema = await this.getSchema();
    this.dbMetadata.tableCount = schema.length;
  }

  // Create empty database
  async createEmpty(name = 'NewDatabase.sqlite'): Promise<void> {
    await this.init();
    if (!this.SQL) throw new Error('Failed to initialize SQLite engine');

    this.db = new this.SQL.Database();
    this.snapshotHistory = [this.db.export()];
    this.dbMetadata = {
      name,
      sizeBytes: 0,
      tableCount: 0,
      loadedAt: new Date(),
      isDirty: false,
    };
  }

  // Save snapshot before mutation
  createSnapshot(): void {
    if (!this.db) return;
    this.snapshotHistory.push(this.db.export());
    // Keep max 5 snapshots to save memory
    if (this.snapshotHistory.length > 5) {
      this.snapshotHistory.shift();
    }
  }

  // Rollback to previous snapshot
  rollbackSnapshot(): boolean {
    if (!this.SQL || this.snapshotHistory.length < 2) return false;
    this.snapshotHistory.pop(); // Remove current
    const previous = this.snapshotHistory[this.snapshotHistory.length - 1];
    this.db = new this.SQL.Database(previous);
    this.dbMetadata.isDirty = true;
    return true;
  }

  canRollback(): boolean {
    return this.snapshotHistory.length > 1;
  }

  // Introspect schema (tables, columns, counts)
  async getSchema(): Promise<TableSchema[]> {
    if (!this.db) return [];

    const tablesResult = this.db.exec(`
      SELECT name, sql FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC;
    `);

    if (!tablesResult || tablesResult.length === 0 || !tablesResult[0].values) {
      return [];
    }

    const schemas: TableSchema[] = [];

    for (const row of tablesResult[0].values) {
      const tableName = String(row[0]);
      const tableSql = String(row[1] || '');

      // Get columns using PRAGMA
      const colResult = this.db.exec(`PRAGMA table_info("${tableName}");`);
      const columns: ColumnInfo[] = [];

      if (colResult && colResult.length > 0 && colResult[0].values) {
        for (const colRow of colResult[0].values) {
          columns.push({
            cid: Number(colRow[0]),
            name: String(colRow[1]),
            type: String(colRow[2] || 'TEXT'),
            notnull: Number(colRow[3]),
            dflt_value: colRow[4],
            pk: Number(colRow[5]),
          });
        }
      }

      // Get row count
      let rowCount = 0;
      try {
        const countResult = this.db.exec(`SELECT COUNT(*) FROM "${tableName}";`);
        if (countResult && countResult[0] && countResult[0].values) {
          rowCount = Number(countResult[0].values[0][0]);
        }
      } catch (err) {
        console.warn(`Could not fetch row count for ${tableName}`, err);
      }

      schemas.push({
        name: tableName,
        rowCount,
        columns,
        sql: tableSql,
      });
    }

    this.dbMetadata.tableCount = schemas.length;
    return schemas;
  }

  // Get schema as a clean formatted string for Gemini prompt injection
  async getSchemaPromptContext(): Promise<string> {
    const schemas = await this.getSchema();
    if (schemas.length === 0) return 'No tables present in database.';

    return schemas
      .map((t) => {
        const cols = t.columns
          .map((c) => `${c.name} ${c.type}${c.pk ? ' PRIMARY KEY' : ''}${c.notnull ? ' NOT NULL' : ''}`)
          .join(', ');
        return `TABLE "${t.name}" (${cols}); [Current Row Count: ${t.rowCount}]`;
      })
      .join('\n');
  }

  // Execute an arbitrary SQL statement
  async executeQuery(sql: string): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('No database is currently loaded. Please upload or choose a sample database.');
    }

    const trimmed = sql.trim();
    const cleanSql = trimmed.endsWith(';') ? trimmed : `${trimmed};`;
    const isMutation = /^(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|TRUNCATE)/i.test(trimmed);

    const startTime = performance.now();

    try {
      if (isMutation) {
        this.createSnapshot();
        this.db.run(cleanSql);
        const rowsModified = this.db.getRowsModified();
        this.dbMetadata.isDirty = true;
        const duration = Math.round(performance.now() - startTime);

        return {
          columns: ['status', 'message', 'affected_rows'],
          values: [['Success', `Statement executed successfully.`, rowsModified]],
          rowCount: 1,
          executionTimeMs: duration,
          isMutation: true,
          affectedRows: rowsModified,
          query: cleanSql,
        };
      } else {
        const result = this.db.exec(cleanSql);
        const duration = Math.round(performance.now() - startTime);

        if (!result || result.length === 0) {
          return {
            columns: ['result'],
            values: [['Query executed successfully with no rows returned.']],
            rowCount: 0,
            executionTimeMs: duration,
            isMutation: false,
            query: cleanSql,
          };
        }

        const columns = result[0].columns;
        const values = result[0].values;

        return {
          columns,
          values,
          rowCount: values.length,
          executionTimeMs: duration,
          isMutation: false,
          query: cleanSql,
        };
      }
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime);
      return {
        columns: ['error'],
        values: [[err?.message || 'SQL execution failed']],
        rowCount: 0,
        executionTimeMs: duration,
        isMutation,
        query: cleanSql,
        error: err?.message || 'SQL error',
      };
    }
  }

  // Update a single cell directly
  async updateCell(
    tableName: string,
    pkCol: string,
    pkVal: any,
    targetCol: string,
    newVal: any
  ): Promise<boolean> {
    if (!this.db) return false;

    try {
      this.createSnapshot();
      const sql = `UPDATE "${tableName}" SET "${targetCol}" = ? WHERE "${pkCol}" = ?;`;
      this.db.run(sql, [newVal, pkVal]);
      this.dbMetadata.isDirty = true;
      return true;
    } catch (err) {
      console.error('Failed to update cell:', err);
      return false;
    }
  }

  // Export current database binary for downloading
  exportBinary(): Uint8Array {
    if (!this.db) throw new Error('No database loaded');
    return this.db.export();
  }

  // Sanitize identifier for SQLite table/column
  private sanitizeName(raw: string, fallback = 'imported_table'): string {
    const clean = raw
      .trim()
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
    return clean || fallback;
  }

  // Generic ingestion of an array of objects into a SQLite table
  async importRecords(rawTableName: string, rows: Record<string, any>[]): Promise<string> {
    await this.init();
    if (!this.db) {
      await this.createEmpty();
    }

    if (!rows || rows.length === 0) {
      throw new Error('No records to import');
    }

    const tableName = this.sanitizeName(rawTableName, 'imported_data');

    // Collect all unique fields across rows (inspect first 250 rows)
    const fieldSet = new Set<string>();
    const scanLimit = Math.min(rows.length, 250);
    for (let i = 0; i < scanLimit; i++) {
      const row = rows[i];
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((k) => {
          if (k.trim()) fieldSet.add(k.trim());
        });
      }
    }

    const fields = Array.from(fieldSet);
    if (fields.length === 0) {
      throw new Error('No valid column headers found in data');
    }

    // Infer column types
    const sampleRows = rows.slice(0, 100);
    const colDefinitions = fields.map((field) => {
      let isInteger = true;
      let isReal = true;
      let hasNonNull = false;

      for (const row of sampleRows) {
        const val = row[field];
        if (val !== null && val !== undefined && val !== '') {
          hasNonNull = true;
          if (typeof val === 'number') {
            if (!Number.isInteger(val)) isInteger = false;
          } else if (typeof val === 'boolean') {
            // Booleans are stored as integers (0/1)
          } else {
            isInteger = false;
            isReal = false;
            break;
          }
        }
      }

      const colType = hasNonNull ? (isInteger ? 'INTEGER' : isReal ? 'REAL' : 'TEXT') : 'TEXT';
      return `"${field.replace(/"/g, '""')}" ${colType}`;
    });

    this.createSnapshot();

    // Recreate table
    this.db!.run(`DROP TABLE IF EXISTS "${tableName}";`);
    this.db!.run(`CREATE TABLE "${tableName}" (id INTEGER PRIMARY KEY AUTOINCREMENT, ${colDefinitions.join(', ')});`);

    // Batch insert
    const escapedCols = fields.map((f) => `"${f.replace(/"/g, '""')}"`).join(', ');
    const placeholders = fields.map(() => '?').join(', ');
    const insertSql = `INSERT INTO "${tableName}" (${escapedCols}) VALUES (${placeholders});`;

    const stmt = this.db!.prepare(insertSql);
    for (const row of rows) {
      const values = fields.map((f) => {
        let val = row[f];
        if (val === undefined || val === null || val === '') return null;
        if (typeof val === 'boolean') return val ? 1 : 0;
        if (typeof val === 'object') {
          try {
            return JSON.stringify(val);
          } catch {
            return String(val);
          }
        }
        return val;
      });
      stmt.run(values);
    }
    stmt.free();

    this.dbMetadata.isDirty = true;
    if (this.dbMetadata.name === 'NewDatabase.sqlite' || this.dbMetadata.name === 'Untitled.sqlite') {
      this.dbMetadata.name = `${tableName}.sqlite`;
    }

    return tableName;
  }

  // Ingest CSV, TSV, or delimited text
  async importCsv(fileName: string, csvContent: string): Promise<string> {
    await this.init();
    if (!this.db) {
      await this.createEmpty();
    }

    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';'],
        complete: async (results) => {
          try {
            if (!results.data || results.data.length === 0) {
              return reject(new Error('Delimited file contains no records'));
            }
            const tableName = await this.importRecords(fileName, results.data as Record<string, any>[]);
            resolve(tableName);
          } catch (err: any) {
            reject(err);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }

  // Ingest Excel files (.xlsx, .xlsm, .xls, .xlsb)
  async importExcel(fileName: string, buffer: ArrayBuffer): Promise<string[]> {
    await this.init();
    if (!this.db) await this.createEmpty();

    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel workbook contains no sheets');
    }

    const baseFileName = this.sanitizeName(fileName);
    const createdTables: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });
      if (!rows || rows.length === 0) continue;

      const rawTargetName = (workbook.SheetNames.length === 1 && sheetName.toLowerCase().startsWith('sheet'))
        ? baseFileName
        : `${baseFileName}_${this.sanitizeName(sheetName)}`;

      const tableName = await this.importRecords(rawTargetName, rows);
      createdTables.push(tableName);
    }

    if (createdTables.length === 0) {
      throw new Error('No tabular data could be read from the Excel sheets');
    }

    return createdTables;
  }

  // Ingest JSON or NDJSON / JSON Lines
  async importJson(fileName: string, jsonContent: string): Promise<string[]> {
    await this.init();
    if (!this.db) await this.createEmpty();

    const trimmed = jsonContent.trim();
    if (!trimmed) throw new Error('JSON file is empty');

    const baseName = this.sanitizeName(fileName);
    const createdTables: string[] = [];

    // Attempt 1: Standard JSON parse
    let parsed: any = null;
    let isNdjson = false;

    try {
      parsed = JSON.parse(trimmed);
    } catch {
      isNdjson = true;
    }

    if (isNdjson) {
      // Attempt 2: Line-delimited JSON (NDJSON)
      const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const ndRows: Record<string, any>[] = [];
      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          if (typeof item === 'object' && item !== null) ndRows.push(item);
        } catch {
          // ignore non-json line
        }
      }

      if (ndRows.length > 0) {
        const t = await this.importRecords(baseName, ndRows);
        return [t];
      }
      throw new Error('Invalid JSON or NDJSON syntax');
    }

    // Array of objects
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) throw new Error('JSON array contains no rows');
      const t = await this.importRecords(baseName, parsed);
      return [t];
    }

    // Object containing tables or data key
    if (typeof parsed === 'object' && parsed !== null) {
      const arrayKeys = Object.keys(parsed).filter((k) => Array.isArray(parsed[k]) && parsed[k].length > 0);

      if (arrayKeys.length > 0) {
        for (const key of arrayKeys) {
          const arrayData = parsed[key];
          const tableName = (arrayKeys.length === 1 && ['data', 'records', 'items', 'rows', 'result'].includes(key.toLowerCase()))
            ? baseName
            : `${baseName}_${this.sanitizeName(key)}`;
          const t = await this.importRecords(tableName, arrayData);
          createdTables.push(t);
        }
        return createdTables;
      }

      // Single object (1 row)
      const t = await this.importRecords(baseName, [parsed]);
      return [t];
    }

    throw new Error('JSON file must contain an array of records or object with collections');
  }

  // Ingest SQL script (.sql)
  async importSql(_fileName: string, sqlContent: string): Promise<string[]> {
    await this.init();
    if (!this.db) await this.createEmpty();

    const prevSchema = await this.getSchema();
    const prevNames = new Set(prevSchema.map((s) => s.name));

    this.createSnapshot();
    try {
      this.db!.exec(sqlContent);
    } catch (err: any) {
      this.rollbackSnapshot();
      throw new Error(`SQL Script execution failed: ${err?.message || err}`);
    }

    this.dbMetadata.isDirty = true;
    const newSchema = await this.getSchema();
    const currentNames = newSchema.map((s) => s.name);
    const added = currentNames.filter((n) => !prevNames.has(n));

    return added.length > 0 ? added : currentNames;
  }

  // Unified file importer handling all formats
  async importAnyFile(file: File): Promise<{ tables: string[]; message: string }> {
    const name = file.name.toLowerCase();

    // SQLite Binary (.db, .sqlite, .sqlite3)
    if (name.endsWith('.db') || name.endsWith('.sqlite') || name.endsWith('.sqlite3')) {
      const buffer = await file.arrayBuffer();
      await this.loadFromBuffer(buffer, file.name);
      const schema = await this.getSchema();
      return {
        tables: schema.map((s) => s.name),
        message: `Loaded SQLite database "${file.name}" (${schema.length} tables)`,
      };
    }

    // Excel spreadsheets (.xlsx, .xlsm, .xls, .xlsb)
    if (name.endsWith('.xlsx') || name.endsWith('.xlsm') || name.endsWith('.xls') || name.endsWith('.xlsb')) {
      const buffer = await file.arrayBuffer();
      const tables = await this.importExcel(file.name, buffer);
      return {
        tables,
        message: `Imported ${tables.length} table(s) from Excel "${file.name}": ${tables.join(', ')}`,
      };
    }

    // JSON and NDJSON (.json, .jsonl, .ndjson)
    if (name.endsWith('.json') || name.endsWith('.jsonl') || name.endsWith('.ndjson')) {
      const text = await file.text();
      const tables = await this.importJson(file.name, text);
      return {
        tables,
        message: `Imported ${tables.length} table(s) from JSON "${file.name}": ${tables.join(', ')}`,
      };
    }

    // SQL Scripts (.sql)
    if (name.endsWith('.sql')) {
      const text = await file.text();
      const tables = await this.importSql(file.name, text);
      return {
        tables,
        message: `Executed SQL script "${file.name}". Active tables: ${tables.join(', ')}`,
      };
    }

    // Delimited text (.csv, .tsv, .txt)
    if (name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.txt')) {
      const text = await file.text();
      const table = await this.importCsv(file.name, text);
      return {
        tables: [table],
        message: `Imported table "${table}" from "${file.name}"`,
      };
    }

    throw new Error(`Unsupported file type: "${file.name}". Supported: .xlsx, .xlsm, .xls, .json, .csv, .tsv, .sql, .sqlite, .db`);
  }

  // Load pre-made sample databases
  async loadSample(sampleId: 'ecommerce' | 'saas'): Promise<void> {
    await this.init();
    if (!this.SQL) throw new Error('SQLite engine not ready');

    this.db = new this.SQL.Database();

    if (sampleId === 'ecommerce') {
      this.dbMetadata = {
        name: 'ecommerce_store.sqlite',
        sizeBytes: 1024 * 64,
        tableCount: 4,
        loadedAt: new Date(),
        isDirty: false,
      };

      this.db.run(`
        CREATE TABLE customers (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          country TEXT NOT NULL,
          total_spent REAL DEFAULT 0,
          joined_at DATE NOT NULL
        );

        CREATE TABLE products (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          price REAL NOT NULL,
          stock_qty INTEGER NOT NULL,
          rating REAL DEFAULT 4.5
        );

        CREATE TABLE orders (
          id INTEGER PRIMARY KEY,
          customer_id INTEGER NOT NULL,
          order_date DATE NOT NULL,
          total_amount REAL NOT NULL,
          status TEXT NOT NULL,
          FOREIGN KEY (customer_id) REFERENCES customers(id)
        );

        CREATE TABLE order_items (
          id INTEGER PRIMARY KEY,
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (product_id) REFERENCES products(id)
        );

        -- Seed Customers
        INSERT INTO customers VALUES 
          (1, 'Aarav Sharma', 'aarav.sharma@example.com', 'India', 1240.50, '2023-01-15'),
          (2, 'Sophia Miller', 'sophia.m@example.com', 'USA', 2890.00, '2022-11-20'),
          (3, 'Liam Chen', 'liam.chen@example.com', 'Canada', 450.75, '2023-03-05'),
          (4, 'Priya Patel', 'priya.p@example.com', 'India', 3120.00, '2022-08-10'),
          (5, 'Marcus Becker', 'marcus.b@example.de', 'Germany', 890.25, '2023-05-12'),
          (6, 'Elena Rostova', 'elena.r@example.com', 'UK', 1780.00, '2022-09-18'),
          (7, 'Carlos Mendez', 'carlos.m@example.es', 'Spain', 620.40, '2023-07-22'),
          (8, 'Yuki Tanaka', 'yuki.t@example.jp', 'Japan', 2410.90, '2022-12-01'),
          (9, 'Chloe Dubois', 'chloe.d@example.fr', 'France', 1350.00, '2023-02-28'),
          (10, 'Zain Malik', 'zain.m@example.com', 'UAE', 4100.80, '2022-06-14');

        -- Seed Products
        INSERT INTO products VALUES
          (1, 'Noise-Cancelling Headphones Pro', 'Electronics', 249.99, 45, 4.8),
          (2, 'Ultra HD 4K Monitor 27-inch', 'Electronics', 399.50, 28, 4.6),
          (3, 'Ergonomic Mechanical Keyboard', 'Electronics', 129.00, 75, 4.7),
          (4, 'Precision Wireless Mouse', 'Electronics', 69.99, 110, 4.4),
          (5, 'Breathable Running Shoes', 'Footwear', 89.95, 60, 4.5),
          (6, 'Minimalist Leather Backpack', 'Accessories', 119.00, 35, 4.9),
          (7, 'Organic Cotton Crewneck T-Shirt', 'Apparel', 29.50, 150, 4.2),
          (8, 'Smart Fitness Tracker Band', 'Electronics', 79.99, 90, 4.3),
          (9, 'Polarized Aviator Sunglasses', 'Accessories', 149.00, 40, 4.7),
          (10, 'Waterproof Hiking Boots', 'Footwear', 165.00, 22, 4.8),
          (11, 'Stainless Steel Thermal Flask 1L', 'Accessories', 34.99, 85, 4.6),
          (12, 'Merino Wool Winter Sweater', 'Apparel', 95.00, 30, 4.5);

        -- Seed Orders
        INSERT INTO orders VALUES
          (101, 1, '2023-10-02', 378.99, 'Delivered'),
          (102, 2, '2023-10-05', 528.50, 'Delivered'),
          (103, 4, '2023-10-08', 249.99, 'Delivered'),
          (104, 10, '2023-10-12', 689.49, 'Processing'),
          (105, 3, '2023-10-15', 69.99, 'Delivered'),
          (106, 5, '2023-10-20', 218.95, 'Shipped'),
          (107, 8, '2023-10-22', 469.49, 'Delivered'),
          (108, 2, '2023-11-01', 399.50, 'Delivered'),
          (109, 6, '2023-11-04', 119.00, 'Delivered'),
          (110, 7, '2023-11-09', 274.99, 'Cancelled'),
          (111, 9, '2023-11-14', 124.50, 'Shipped'),
          (112, 1, '2023-11-18', 129.00, 'Delivered'),
          (113, 10, '2023-11-25', 564.00, 'Processing'),
          (114, 4, '2023-12-02', 434.49, 'Delivered'),
          (115, 8, '2023-12-05', 184.99, 'Shipped');

        -- Seed Order Items
        INSERT INTO order_items VALUES
          (1, 101, 1, 1, 249.99),
          (2, 101, 3, 1, 129.00),
          (3, 102, 2, 1, 399.50),
          (4, 102, 3, 1, 129.00),
          (5, 103, 1, 1, 249.99),
          (6, 104, 2, 1, 399.50),
          (7, 104, 1, 1, 249.99),
          (8, 104, 4, 1, 40.00),
          (9, 105, 4, 1, 69.99),
          (10, 106, 5, 1, 89.95),
          (11, 106, 3, 1, 129.00),
          (12, 107, 2, 1, 399.50),
          (13, 107, 4, 1, 69.99),
          (14, 108, 2, 1, 399.50),
          (15, 109, 6, 1, 119.00),
          (16, 110, 1, 1, 249.99),
          (17, 111, 7, 1, 29.50),
          (18, 111, 12, 1, 95.00),
          (19, 112, 3, 1, 129.00),
          (20, 113, 6, 2, 119.00),
          (21, 113, 11, 2, 34.99);
      `);
    } else {
      this.dbMetadata = {
        name: 'saas_analytics.sqlite',
        sizeBytes: 1024 * 48,
        tableCount: 3,
        loadedAt: new Date(),
        isDirty: false,
      };

      this.db.run(`
        CREATE TABLE plans (
          id INTEGER PRIMARY KEY,
          plan_name TEXT NOT NULL,
          monthly_price REAL NOT NULL,
          max_seats INTEGER NOT NULL
        );

        CREATE TABLE accounts (
          id INTEGER PRIMARY KEY,
          company_name TEXT NOT NULL,
          plan_id INTEGER NOT NULL,
          mrr REAL NOT NULL,
          country TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at DATE NOT NULL,
          FOREIGN KEY (plan_id) REFERENCES plans(id)
        );

        CREATE TABLE invoices (
          id INTEGER PRIMARY KEY,
          account_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          billing_date DATE NOT NULL,
          payment_status TEXT NOT NULL,
          FOREIGN KEY (account_id) REFERENCES accounts(id)
        );

        INSERT INTO plans VALUES
          (1, 'Starter', 29.00, 3),
          (2, 'Growth', 99.00, 10),
          (3, 'Enterprise', 499.00, 50);

        INSERT INTO accounts VALUES
          (1, 'Acme Corp', 3, 499.00, 'USA', 'Active', '2023-01-10'),
          (2, 'Nexus Digital', 2, 99.00, 'UK', 'Active', '2023-02-18'),
          (3, 'PixelCraft Studios', 1, 29.00, 'Canada', 'Active', '2023-03-05'),
          (4, 'Vanguard Tech', 3, 499.00, 'Germany', 'Active', '2022-11-20'),
          (5, 'FinFlow Solutions', 3, 499.00, 'India', 'Active', '2023-04-12'),
          (6, 'Echo Media Labs', 2, 99.00, 'Australia', 'Past Due', '2023-06-01'),
          (7, 'Hyperion Cloud', 2, 99.00, 'Singapore', 'Active', '2023-07-15'),
          (8, 'Zenith Retail', 1, 29.00, 'USA', 'Cancelled', '2023-05-22'),
          (9, 'OmniHealth AI', 3, 499.00, 'USA', 'Active', '2022-12-10'),
          (10, 'Quantum Logistics', 2, 99.00, 'Netherlands', 'Active', '2023-08-01');

        INSERT INTO invoices VALUES
          (1001, 1, 499.00, '2023-09-01', 'Paid'),
          (1002, 2, 99.00, '2023-09-01', 'Paid'),
          (1003, 3, 29.00, '2023-09-01', 'Paid'),
          (1004, 4, 499.00, '2023-09-01', 'Paid'),
          (1005, 5, 499.00, '2023-09-01', 'Paid'),
          (1006, 1, 499.00, '2023-10-01', 'Paid'),
          (1007, 2, 99.00, '2023-10-01', 'Paid'),
          (1008, 4, 499.00, '2023-10-01', 'Paid'),
          (1009, 5, 499.00, '2023-10-01', 'Paid'),
          (1010, 6, 99.00, '2023-10-01', 'Failed'),
          (1011, 1, 499.00, '2023-11-01', 'Paid'),
          (1012, 4, 499.00, '2023-11-01', 'Paid'),
          (1013, 9, 499.00, '2023-11-01', 'Paid'),
          (1014, 10, 99.00, '2023-11-01', 'Paid');
      `);
    }

    this.snapshotHistory = [this.db.export()];
    const schemas = await this.getSchema();
    this.dbMetadata.tableCount = schemas.length;
  }
}

export const sqliteService = new SqliteService();
