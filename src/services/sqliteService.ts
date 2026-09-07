import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import Papa from 'papaparse';
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
      locateFile: (file) => `/${file}`,
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

  // Ingest CSV and turn into SQLite table
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
        complete: (results) => {
          try {
            if (!results.data || results.data.length === 0) {
              return reject(new Error('CSV file contains no records'));
            }

            const rawTableName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            const tableName = rawTableName || 'imported_data';
            const fields = results.meta.fields || [];

            if (fields.length === 0) {
              return reject(new Error('No column headers found in CSV'));
            }

            // Infer column types from first 50 rows
            const sampleRows = results.data.slice(0, 50) as Record<string, any>[];
            const colDefinitions = fields.map((field) => {
              let isInteger = true;
              let isReal = true;

              for (const row of sampleRows) {
                const val = row[field];
                if (val !== null && val !== undefined && val !== '') {
                  if (typeof val === 'number') {
                    if (!Number.isInteger(val)) isInteger = false;
                  } else {
                    isInteger = false;
                    isReal = false;
                    break;
                  }
                }
              }

              const colType = isInteger ? 'INTEGER' : isReal ? 'REAL' : 'TEXT';
              return `"${field}" ${colType}`;
            });

            this.createSnapshot();

            // Create table
            this.db!.run(`DROP TABLE IF EXISTS "${tableName}";`);
            this.db!.run(`CREATE TABLE "${tableName}" (id INTEGER PRIMARY KEY AUTOINCREMENT, ${colDefinitions.join(', ')});`);

            // Batch insert
            const placeholders = fields.map(() => '?').join(', ');
            const insertSql = `INSERT INTO "${tableName}" (${fields.map((f) => `"${f}"`).join(', ')}) VALUES (${placeholders});`;

            const stmt = this.db!.prepare(insertSql);
            for (const row of results.data as Record<string, any>[]) {
              const values = fields.map((f) => (row[f] === undefined ? null : row[f]));
              stmt.run(values);
            }
            stmt.free();

            this.dbMetadata.isDirty = true;
            this.dbMetadata.name = this.dbMetadata.name === 'NewDatabase.sqlite' ? `${tableName}.sqlite` : this.dbMetadata.name;

            resolve(tableName);
          } catch (err: any) {
            reject(err);
          }
        },
        error: (err: any) => reject(err),
      });
    });
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
