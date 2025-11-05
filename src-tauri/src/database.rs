use rusqlite::{Connection, Result as SqliteResult, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct Collection {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Diagram {
    pub id: i64,
    pub collection_id: i64,
    pub name: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_data_dir: PathBuf) -> SqliteResult<Self> {
        // Ensure app data directory exists
        std::fs::create_dir_all(&app_data_dir)
            .map_err(|e| rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CANTOPEN),
                Some(format!("Failed to create app data directory: {}", e))
            ))?;
        
        let db_path = app_data_dir.join("mermaid-ui.db");
        let conn = Connection::open(&db_path)?;
        
        let db = Database {
            conn: Mutex::new(conn),
        };
        
        db.init()?;
        Ok(db)
    }
    
    fn init(&self) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS collections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            rusqlite::params![],
        )?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS diagrams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                collection_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
            )",
            rusqlite::params![],
        )?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_diagrams_collection ON diagrams(collection_id)",
            rusqlite::params![],
        )?;
        
        // Create default collection if none exists
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM collections",
            rusqlite::params![],
            |row| row.get(0),
        )?;
        
        if count == 0 {
            conn.execute(
                "INSERT INTO collections (name, description) VALUES (?, ?)",
                rusqlite::params!["Default Collection", "Your default collection of diagrams"],
            )?;
        }
        
        Ok(())
    }
    
    pub fn get_all_collections(&self) -> SqliteResult<Vec<Collection>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, created_at, updated_at FROM collections ORDER BY created_at DESC"
        )?;
        
        let collections = stmt.query_map(rusqlite::params![], |row| {
            Ok(Collection {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;
        
        Ok(collections)
    }
    
    pub fn get_collection(&self, id: i64) -> SqliteResult<Option<Collection>> {
        let conn = self.conn.lock().unwrap();
        Self::get_collection_internal(&conn, id)
    }
    
    fn get_collection_internal(conn: &Connection, id: i64) -> SqliteResult<Option<Collection>> {
        let mut stmt = conn.prepare(
            "SELECT id, name, description, created_at, updated_at FROM collections WHERE id = ?"
        )?;
        
        let collection = stmt.query_row(rusqlite::params![id], |row| {
            Ok(Collection {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        }).optional()?;
        
        Ok(collection)
    }
    
    pub fn create_collection(&self, name: String, description: Option<String>) -> SqliteResult<Collection> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO collections (name, description, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
            rusqlite::params![name, description],
        )?;
        
        let id = conn.last_insert_rowid();
        Self::get_collection_internal(&conn, id)
            .and_then(|opt| opt.ok_or_else(|| rusqlite::Error::QueryReturnedNoRows))
    }
    
    pub fn update_collection(&self, id: i64, name: String, description: Option<String>) -> SqliteResult<Collection> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE collections SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            rusqlite::params![name, description, id],
        )?;
        
        Self::get_collection_internal(&conn, id)
            .and_then(|opt| opt.ok_or_else(|| rusqlite::Error::QueryReturnedNoRows))
    }
    
    pub fn delete_collection(&self, id: i64) -> SqliteResult<bool> {
        let conn = self.conn.lock().unwrap();
        let changes = conn.execute("DELETE FROM collections WHERE id = ?", rusqlite::params![id])?;
        Ok(changes > 0)
    }
    
    pub fn get_diagrams_by_collection(&self, collection_id: i64) -> SqliteResult<Vec<Diagram>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, collection_id, name, content, created_at, updated_at FROM diagrams WHERE collection_id = ? ORDER BY created_at DESC"
        )?;
        
        let diagrams = stmt.query_map(rusqlite::params![collection_id], |row| {
            Ok(Diagram {
                id: row.get(0)?,
                collection_id: row.get(1)?,
                name: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;
        
        Ok(diagrams)
    }
    
    pub fn get_diagram(&self, id: i64) -> SqliteResult<Option<Diagram>> {
        let conn = self.conn.lock().unwrap();
        Self::get_diagram_internal(&conn, id)
    }
    
    fn get_diagram_internal(conn: &Connection, id: i64) -> SqliteResult<Option<Diagram>> {
        let mut stmt = conn.prepare(
            "SELECT id, collection_id, name, content, created_at, updated_at FROM diagrams WHERE id = ?"
        )?;
        
        let diagram = stmt.query_row(rusqlite::params![id], |row| {
            Ok(Diagram {
                id: row.get(0)?,
                collection_id: row.get(1)?,
                name: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        }).optional()?;
        
        Ok(diagram)
    }
    
    pub fn create_diagram(&self, collection_id: i64, name: String, content: String) -> SqliteResult<Diagram> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO diagrams (collection_id, name, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
            rusqlite::params![collection_id, name, content],
        )?;
        
        let id = conn.last_insert_rowid();
        Self::get_diagram_internal(&conn, id)
            .and_then(|opt| opt.ok_or_else(|| rusqlite::Error::QueryReturnedNoRows))
    }
    
    pub fn update_diagram(&self, id: i64, name: String, content: String) -> SqliteResult<Diagram> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE diagrams SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            rusqlite::params![name, content, id],
        )?;
        
        Self::get_diagram_internal(&conn, id)
            .and_then(|opt| opt.ok_or_else(|| rusqlite::Error::QueryReturnedNoRows))
    }
    
    pub fn delete_diagram(&self, id: i64) -> SqliteResult<bool> {
        let conn = self.conn.lock().unwrap();
        let changes = conn.execute("DELETE FROM diagrams WHERE id = ?", rusqlite::params![id])?;
        Ok(changes > 0)
    }
}

