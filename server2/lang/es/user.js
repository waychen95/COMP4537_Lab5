const MESSAGE = {
    DEFAULT_PATIENT_SUCCESS: "Default patients inserted successfully.",
    INSERT_SUCCESS: "Data inserted successfully.",
    EMPTY_QUERY_ERROR: "Query cannot be empty.",
    FORBIDDEN_QUERY_ERROR: "Only SELECT and INSERT queries are allowed. DROP, DELETE, UPDATE operations are forbidden.",
    METHOD_NOT_ALLOWED: "Method not allowed. Use GET for SELECT and POST for INSERT.",
    NOT_FOUND: "Endpoint not found.",
    SERVER_ERROR: "Internal server error occurred."
};

module.exports = { MESSAGE };