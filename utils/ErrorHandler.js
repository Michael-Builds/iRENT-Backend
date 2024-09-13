/**
 * ErrorHandler class extends the built-in Error class to include a status code.
 * This is useful for differentiating between different types of errors in an application.
 */
class ErrorHandler extends Error {
    // Property to hold the status code of the error
    statusCode;

    /**
     * Constructor to create an instance of ErrorHandler.
     * @param message - The error message.
     * @param status - The HTTP status code associated with the error.
     */
    constructor(message, status) {
        // Call the parent class (Error) constructor with the error message
        super(message);

        // Assign the status code to the instance
        this.statusCode = status;

        // Capture the stack trace for debugging purposes, omitting the constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }
}

// Export the ErrorHandler class as the default export of this module
export default ErrorHandler;
