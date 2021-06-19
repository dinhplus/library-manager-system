const createErrorClass = require('create-error-class')

const internals = {
    system: [
        // JavaScript
        EvalError,
        RangeError,
        ReferenceError,
        SyntaxError,
        TypeError,
        URIError,
    ],
}

function isSystemError(err) {
    for (let i = 0; i < internals.system.length; i += 1) {
        if (err instanceof internals.system[i]) {
            return true
        }
    }

    return false
}

/* An error was returned from a third party supplier API */
const ThirdPartyError = createErrorClass('ThirdPartyError', function e(err) {
    this.message = `Third party API returned unexpected error with code=[${err.code}] and message=[${err.message}]`
})

const InvalidKeyValue = createErrorClass('InvalidKeyValue', function e(k, v) {
    this.message = `${k} [${v}] invalid`
})

/* Invalid parameter was supplied */
const InvalidRequestError = createErrorClass('InvalidRequestError', function e(verbosity) {
    this.message = '(╯°□°）╯︵ ┻━┻ missing or invalid params'
    this.verbosity = verbosity
})

const InvalidResponseError = createErrorClass('InvalidResponseError', function e() {
    this.message = 'Supplier returned response but missing or invalid data'
})

/* An authentication error occured when requesting API */
const AuthenticationError = createErrorClass('AuthenticationError')

/* Cannot make booking success */
const BookingError = createErrorClass('BookingError')

const PNRNotFound = createErrorClass('PNRNotFound', function e(pnr) {
    this.message = `PNR [${pnr}] not found`
})

module.exports = {
    ThirdPartyError,
    InvalidKeyValue,
    InvalidRequestError,
    InvalidResponseError,
    AuthenticationError,
    BookingError,
    PNRNotFound,
    isSystemError,
}
