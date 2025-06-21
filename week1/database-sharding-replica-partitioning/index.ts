import express from "express";
import postgres from "postgres";

const app = express();

app.use(express.json());

const sql = postgres("postgresql://adityabharadwaj@localhost:5432/postgres", {
    ssl: false, // Disable SSL for local development
});

async function initializeDatabase() {
    try {
      // Create key_value_store table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS key_value_store (
          key VARCHAR(255) UNIQUE NOT NULL PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at BIGINT
        )
      `;
      console.log("✅ Database table initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize database:", error);
      process.exit(1);
    }
  }
  

app.get("/get/:key", async (req, res) => {
    try {
    const { key } = req.params;
    const user = await sql`SELECT * FROM key_value_store WHERE key = ${key}`;
    console.log(user);
    if (user[0] == undefined || user[0].expires_at == -1) {
        res.json({"status": "The key doesn't exist"});
        return;
    } 
    if (user[0].expires_at < Date.now()) {
        res.json({"status": "The key is expired"});
        return;
    } else {
        res.send(user);
    }
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Database connection failed" });
    }
  });

app.post("/put", async(req, res) => {
    try {
        const {key, value, ttl} = req.body;
        const time = Date.now() + (ttl * 1000);
        console.log(time);
        // This is how you write an UPSERT statement in Postgres
        const result = await sql`
        INSERT INTO key_value_store (key, value, expires_at)
        VALUES (${key}, ${value}, ${time})
        ON CONFLICT (key) 
        DO UPDATE SET 
          value = EXCLUDED.value,
          expires_at = EXCLUDED.expires_at
        RETURNING key, value, expires_at
      `;
          res.json(result);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Database connection failed" });
    }
})

app.delete("/delete/:key", async (req, res) => {
    try {
        console.log("Here with key" + req.params.key);
        const key = req.params.key;
        let result = await sql`UPDATE key_value_store 
            SET expires_at = -1 
            WHERE key = ${key} AND expires_at != -1
            RETURNING key`;
        if (result.length === 0) {
            return res.status(404).json({ error: "Key not found" });
        }
        res.json({ 
            success: true, 
            message: `Key '${key}' deleted successfully` 
        });
    } catch (error) {
        res.status(500);
        res.status(500).json({ error: "Database operation failed" });
    }
});
  
app.listen(3000, async () => {
    initializeDatabase()
});