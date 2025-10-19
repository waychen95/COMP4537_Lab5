const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'localhost',
    user: 'lab5_user',
    password: 'lab5user!',
    database: 'lab5_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const ROOT_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'lab5!'
};

let pool;

async function createDatabaseAndUser() {
    const rootConnection = await mysql.createConnection(ROOT_CONFIG);

    try {
        await rootConnection.query(`CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.database}`);
        console.log(`Database ${DB_CONFIG.database} created or already exists`);

        await rootConnection.query(
            `CREATE USER IF NOT EXISTS '${DB_CONFIG.user}'@'localhost' IDENTIFIED BY '${DB_CONFIG.password}'`
        );

        await rootConnection.query(
            `GRANT SELECT, INSERT ON ${DB_CONFIG.database}.* TO '${DB_CONFIG.user}'@'localhost'`
        );

        await rootConnection.query('FLUSH PRIVILEGES');
        console.log(`User ${DB_CONFIG.user} created with SELECT and INSERT privileges only`);

    } finally {
        await rootConnection.end();
    }
}

async function createPatientTable() {

    const rootConnection = await mysql.createConnection({
        ...ROOT_CONFIG,
        database: DB_CONFIG.database
    });

    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS patient (
                patientId INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                dateOfBirth DATE NOT NULL,
                INDEX idx_name (name),
                INDEX idx_dob (dateOfBirth)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        await rootConnection.query(createTableQuery);
        console.log('Patient table created or already exists');

    } finally {
        await rootConnection.end();
    }
}

async function initializeDatabase() {
    try {
        await createDatabaseAndUser();
        await createPatientTable();

        pool = mysql.createPool(DB_CONFIG);

        console.log('Database initialization complete');

    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

async function insertDefaultPatients() {
    const connection = await pool.getConnection();

    try {
        const insertQuery = `
            INSERT INTO patient (name, dateOfBirth) VALUES
            ('Sara Brown', '1901-01-01'),
            ('John Smith', '1941-01-01'),
            ('Jack Ma', '1961-01-30'),
            ('Elon Musk', '1999-01-01')
        `;

        const [result] = await connection.query(insertQuery);
        console.log(`Inserted ${result.affectedRows} default patients`);

        return result;

    } finally {
        connection.release();
    }
}

async function executeQuery(query) {
    const connection = await pool.getConnection();

    try {
        const [result] = await connection.query(query);
        return result;

    } finally {
        connection.release();
    }
}

async function closeDatabase() {
    if (pool) {
        await pool.end();
        console.log('Database connection pool closed');
    }
}

process.on('SIGINT', async () => {
    await closeDatabase();
    process.exit(0);
});

module.exports = {
    initializeDatabase,
    insertDefaultPatients,
    executeQuery,
    closeDatabase
};