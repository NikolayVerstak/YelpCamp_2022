class ExpressError extends Error { //take methods from Error class (basic Error Handler) and extend using ExpressError class
    constructor(message, statusCode) { 
        super(); //call to get methods prototipe
        this.message = message; //
        this.statusCode = statusCode;
    }
}

module.exports = ExpressError; //other files are able to see it