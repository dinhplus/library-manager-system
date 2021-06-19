const _ = require('lodash')

const defaults = {
    production: false,
    env: 'dev',
    port: 4000,
    secret: 'secret-boilerplate-token',
    hotel_secret: 'n0dejssuCk',
    flight_secret: 'n0dejssuCk',
    card_secret: 'n0dejssuCk',
    mariadbUrl: 'mysql://root@localhost:3306/Dashboard',
    redisPrefix: 'dashboard:',
    redisHost: 'localhost',
    redisPort: '6379',
    redisDb: 0,
    redisPassword: null
}

let custom = {
    production: process.env.NODE_ENV === 'production' ||
        process.env.ENV === 'production',
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    secret: process.env.SECRET,
    hotel_secret: process.env.HOTEL_SECRET,
    flight_secret: process.env.FLIGHT_SECRET,
    card_secret: process.env.CARD_SECRET,
    mariadbUrl: process.env.MARIADB_MASTER_URL,
    redisPrefix: process.env.REDIS_PREFIX,
    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT,
    redisPassword: process.env.REDIS_PASSWORD,
    redisDb: process.env.REDIS_DB,
    baseUrl: {
        hotelinfo: process.env.HOTEL_INFO_URL,
        offer: process.env.OFFER_URL,
        booking: process.env.BOOKING_URL,
        flight: process.env.FLIGHT_URL,
        car: process.env.CAR_URL,
        transporter: process.env.TRANSPORTER_URL
    },
    auth: {
        google: {
            clientId: process.env.GOOGLE_AUTH_CLIENT_ID,
            secret: process.env.GOOGLE_AUTH_SECRET
        }
    }
}

custom = _.pickBy(custom, _.identity)

const config = {
    ...defaults,
    ...custom
}

module.exports = config