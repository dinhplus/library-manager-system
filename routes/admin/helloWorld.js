const Router = require('koa-router')
const router = new Router()
const debug = require('debug')('hello world Router')

router.post('/hello-world', async ctx => {
    debug('POST /login')
    const { body } = ctx.request

    ctx.body = {
        success: true,
        data: {
           "hello": "world"
        }
    }


})

module.exports = router
