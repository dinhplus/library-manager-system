const debug = require('debug')('dashboard-api:middleware')
const jwt = require('jwt-simple')
const moment = require('moment')
const _ = require('lodash')
const uuid = require('uuid')

const config = require('../config')
const { redis, knex } = require('../models')
const { fetchUserByEmail } = require('../models/user')
// const { PRODUCT_LIST, ApiHelper } = require('../apis/gateway')
// const Log = require('../models/log')

const loggingMethod = ['POST', 'PUT', 'PATCH', 'DELETE']
const loggingPathIgnore = ['/login']

async function authorize(ctx, next) {
    debug('authorize')

    const { headers } = ctx
    const goodReq = headers['x-access-token'] && headers['x-key']
    ctx.assert(goodReq, 400, 'missing x-access-token/x-key in headers')

    let decoded = null
    try {
        decoded = jwt.decode(headers['x-access-token'], config.secret)
        const notExpired = decoded.expire > moment().unix()
        ctx.assert(notExpired, 401, 'token expired')
        ctx.assert(decoded.email === headers['x-key'], 401, 'invalid x-key')
    } catch (err) {
        debug('authorize', err)
        ctx.throw(err.message || 'invalid token', 401)
    }

    const user = await fetchUserByEmail(decoded.email)
    ctx.assert(user, 404, 'user not found')
    delete user.password_hash

    const getTokens = async () => {
        const credentials = await knex
            .select('email', 'password', 'product')
            .from('product_access_details')
            .andWhere('del_flag', 0)

        const tokens = credentials.map(
            (creds) => {}
            // ApiHelper.getToken(creds)
            //     .then(token => ({
            //         [creds.product]: {
            //             'x-key': creds.email,
            //             'x-access-token': token
            //         }
            //     }))
            //     .catch(() => ({
            //         // ignore
            //     }))
        )

        return Promise.all(tokens)
    }

    const tokens = await redis.cachedExecute(
        {
            key: `${decoded.email}:tokens`,
            ttl: '6 days',
            json: true,
        },
        getTokens
    )

    user.context = _.defaults(...tokens)

    ctx.User = user

    return next()
}

// async function checkProduct(ctx, next) {
//     const { product } = ctx.params

//     ctx.assert(
//         Object.values(PRODUCT_LIST).includes(product),
//         true,
//         `[${product}] is not supported`
//     )

//     return next()
// }

// async function log(ctx, next) {
//     let error = null
//     ctx.request.id = uuid().replace(/-/g, '') // because hyphen sucks
//     try {
//         await next()
//     } catch (err) {
//         error = err
//         // error handler
//         if (err.code === 'ECONNREFUSED') {
//             ctx.status = 504
//             ctx.body = {
//                 code: err.code,
//                 message: err.message
//             }
//         } else if (err.name === 'ThirdPartyError') {
//             ctx.status = 502
//             ctx.body = {
//                 code: 502,
//                 message: err.message
//             }
//         } else if (err.name === 'AuthenticationError') {
//             ctx.status = 401
//             ctx.body = {
//                 code: 401,
//                 message: err.message
//             }
//         } else {
//             ctx.status = 400
//             const body = {
//                 code: 400,
//                 message: err.message,
//                 verbosity: err.verbosity
//             }

//             ctx.body = body
//         }
//     }

//     const { _matchedRoute: matchedRoute } = ctx

//     if (
//         loggingMethod.includes(ctx.method) &&
//         !loggingPathIgnore.includes(matchedRoute)
//     ) {
//         const requestLog = new Log({
//             path: ctx.path,
//             matched_route: matchedRoute,
//             method: ctx.method,
//             user: ctx.request.headers['x-key'],
//             status: ctx.status,
//             request: {
//                 query: ctx.query,
//                 // params: ctx.params,
//                 body: ctx.request.body
//             },
//             response: error || ctx.body
//         })

//         requestLog.createLog()
//     }
// }

module.exports = {
    authorize,
    // checkProduct,
    // log
}
