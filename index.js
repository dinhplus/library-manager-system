const debug = require('debug')('libra-api')
require('dotenv').config({ path: '.localenv' })
const glob = require('glob')
const Koa = require('koa')
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser')
const compress = require('koa-compress')
const zlib = require('zlib')
const { serverExceptionCatching } = require('./utils/alert')
const config = require('./config')
const router = require('./routes/index')
// const { log } =      require('./middleware/index')

const app = new Koa()
app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err) {
        ctx.app.emit('error', err, ctx)
    }
})
app.use(
    bodyParser({
        enableTypes: ['json', 'form', 'text']
    })
)

app.use(cors({ origin: '*' }))

app.use(
    compress({
        threshold: 2048,
        flush: zlib.Z_SYNC_FLUSH,
        level: 9
    })
)

// simple request middleware
// app.use(async (ctx, next) => {
//     ctx.request.id = uuid().replace(/-/g, '') // because hyphen sucks
//     await next()
// })
// app.use(log)

app.use(router.routes())

if (!module.parent) app.listen(config.port)
app.on('error', async (err, ctx) => {
    debug(err)
    await serverExceptionCatching(ctx)
})
