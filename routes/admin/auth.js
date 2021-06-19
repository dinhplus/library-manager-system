const debug = require('debug')('dashboard-api:routes:auth')
const Router = require('koa-router')
const jwt = require('jwt-simple')
const Joi = require('joi')
const moment = require('moment')
const { compareHash, hashPassword } = require('../../utils/auth')
const config = require('../../config')
const { knex, redis } = require('../../models')
// const googleLogin = require('../models/google-login')
const { fetchUserByEmail } = require('../../models/user')
const { InvalidRequestError } = require('../../utils/error')
const { authorize } = require('../../middleware')

const router = new Router()

router.post('/login', async (ctx) => {
    debug('POST /login')
    const { body } = ctx.request
    const schema = Joi.object()
        .keys({
            email: Joi.string(),
            password: Joi.string(),
            token: Joi.string(),
        })
        .and('email', 'password')
        .xor('email', 'token')

    const err = Joi.validate(body, schema).error
    const verbosity = !err || err.message

    if (err) {
        ctx.status = 400
        ctx.body = {
            success: false,
            message: '(╯°□°）╯︵ ┻━┻ missing or invalid params',
            verbosity,
        }
    } else {
        try {
            let user
            let validHash
            if (body.token) {
                const googleUser = await googleLogin.exchangeToken(body.token)

                const currentUser = await googleLogin.checkAccount(googleUser)

                if (currentUser.del_flag === 1) {
                    throw new Error('Your account is not exist. Please contact Gateway team to setup.')
                }

                user = await fetchUserByEmail(googleUser.email)
                user = Object.assign(user, googleUser)
            } else {
                user = await fetchUserByEmail(body.email)
                validHash = await compareHash(body.password, user.password_hash)
                if (!user || !validHash) {
                    throw new Error('invalid email/password')
                }
            }

            const payload = {
                id: user.id,
                email: user.email,
                expire: moment().add('7', 'days').unix(),
            }

            ctx.body = {
                success: true,
                data: {
                    auth_token: jwt.encode(payload, config.secret),
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    external: user.external,
                    permissions: user.permissions,
                },
            }
        } catch (e) {
            ctx.body = {
                success: false,
                message: `login failed: ${e.message}`,
            }
        }
    }
})
router.post('/:product/generate-token', authorize, async (ctx) => {
    debug('POST /generate-token')
    const { body } = ctx.request
    const { product } = ctx.params
    const schema = Joi.object().keys({
        id: Joi.string().required(),
        email: Joi.string().required(),
    })

    const err = Joi.validate(body, schema).error
    const verbosity = !err || err.message

    if (err) {
        ctx.status = 400
        ctx.body = {
            success: false,
            message: '(╯°□°）╯︵ ┻━┻ missing or invalid params',
            verbosity,
        }
    } else {
        try {
            const payload = {
                id: body.id,
                email: body.email,
                expire: moment().add('35', 'minutes')
.unix(),
            }

            const productSecret = config[`${product}_secret`]

            if (!productSecret) {
                throw new Error(`Not found ${product} config`)
            }

            ctx.body = {
                success: true,
                data: {
                    auth_token: jwt.encode(payload, productSecret),
                },
            }
        } catch (e) {
            ctx.body = {
                success: false,
                message: `generate token failed: ${e.message}`,
            }
        }
    }
})

router.post('/signup', async (ctx) => {
    debug('POST /signup')
    const { body } = ctx.request
    const schema = Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().required(),
        name: Joi.string().required(),
        role_id: Joi.string().required(),
    })

    const err = Joi.validate(body, schema).error
    const verbosity = !err || err.message

    if (err) {
        ctx.status = 400
        ctx.body = {
            success: false,
            message: '(╯°□°）╯︵ ┻━┻ missing or invalid params',
            verbosity,
        }
    } else {
        try {
            const u = await knex.select('email').from('user')
.where('email', body.email)

            if (u.length) {
                throw new Error(`user ${body.email} already exits`)
            }

            await knex('user').insert({
                email: body.email,
                password_hash: hashPassword(body.password),
                name: body.name,
                role_id: body.role_id,
            })

            ctx.body = {
                success: true,
            }
        } catch (e) {
            ctx.body = {
                success: false,
                message: `cannot create user: ${e.message}`,
            }
        }
    }
})

router.post('/change-password', authorize, async (ctx) => {
    const { email } = ctx.User
    const { body } = ctx.request
    const schema = Joi.object().keys({
        password: Joi.string().required(),
        new_password: Joi.string().required(),
    })

    const { error } = Joi.validate(body, schema)

    if (error) {
        throw new InvalidRequestError(!error || error.details)
    } else {
        const user = await fetchUserByEmail(email)
        const validHash = await compareHash(body.password, user.password_hash)

        if (!user || !validHash) {
            throw new Error('password is incorrect')
        }

        await knex('user')
            .update({
                password_hash: hashPassword(body.new_password),
            })
            .where('id', user.id)

        await redis.del(`user:${email}`)

        ctx.body = ''
    }
})

module.exports = router
