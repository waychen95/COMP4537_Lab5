const http = require('http');
const url = require('url');
const { initializeDatabase, insertDefaultPatients, executeQuery } = require('./db');
const { MESSAGE } = require('./lang/en/user');

const PORT = 8081;
const ALLOWED_ORIGINS = [
    'https://juhyunp.xyz',
    'https://www.juhyunp.xyz',
    'http://localhost:63342',
    'http://127.0.0.1:63342',
    'http://localhost:3001',
    'http://127.0.0.1:5500'
];

function setCORSHeaders(res, origin) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Max-Age', '86400');
}

function isQueryAllowed(query) {
    const trimmedQuery = query.trim().toLowerCase();

    const forbiddenKeywords = ['drop', 'delete', 'update', 'alter', 'truncate', 'create'];

    for (const keyword of forbiddenKeywords) {
        if (trimmedQuery.includes(keyword)) {
            return false;
        }
    }

    if (!trimmedQuery.startsWith('select') && !trimmedQuery.startsWith('insert')) {
        return false;
    }

    return true;
}

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin || '';
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    setCORSHeaders(res, origin);

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    try {
        if (pathname === '/api/insertPatient' && (method === 'GET' || method === 'POST')) {
            const result = await insertDefaultPatients();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: MESSAGE.DEFAULT_PATIENT_SUCCESS,
                affectedRows: result.affectedRows
            }));
        }
        else if (pathname.startsWith('/api/v1/sql/')) {
            const encodedQuery = pathname.substring('/api/v1/sql/'.length);
            let query = decodeURIComponent(encodedQuery);

            if (method === 'POST') {
                const body = await parseRequestBody(req);
                query = body.query || query;
            }

            if (!query) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: MESSAGE.EMPTY_QUERY_ERROR
                }));
                return;
            }

            if (!isQueryAllowed(query)) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: MESSAGE.FORBIDDEN_QUERY_ERROR
                }));
                return;
            }

            const trimmedQuery = query.trim().toLowerCase();

            if (trimmedQuery.startsWith('select') && method !== 'GET') {
                res.writeHead(405, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: MESSAGE.METHOD_NOT_ALLOWED
                }));
                return;
            }

            if (trimmedQuery.startsWith('insert') && method !== 'POST') {
                res.writeHead(405, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: MESSAGE.METHOD_NOT_ALLOWED
                }));
                return;
            }

            const result = await executeQuery(query);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            if (trimmedQuery.startsWith('select')) {
                res.end(JSON.stringify(result));
            } else {
                res.end(JSON.stringify({
                    success: true,
                    message: MESSAGE.INSERT_SUCCESS,
                    affectedRows: result.affectedRows
                }));
            }
        }
        else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: MESSAGE.NOT_FOUND
            }));
        }
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            message: MESSAGE.SERVER_ERROR,
            error: error.message
        }));
    }
});

initializeDatabase().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});