const sqlite3 = require('sqlite3').verbose(); // Importera SQLite3-biblioteket
const path = require('path'); // Hanterar fil- och katalogvägar

// Ange sökvägen till databasen
const dbFilePath = path.resolve(process.cwd(), './db/skandiWall.db');

// Skapar en anslutning till SQLite-databasen
const db = new sqlite3.Database(dbFilePath, (err) => {
    if (err) {
        console.error('Fel vid anslutning till databasen:', err.message);
        process.exit(1); // Avsluta programmet om anslutningen misslyckas
    } else {
        console.log('Anslutning till SQLite-databasen lyckades.');
    }
});

// Exportera databasanslutningen för att använda i andra filer
module.exports = db;