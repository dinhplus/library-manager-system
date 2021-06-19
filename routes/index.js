const glob = require('glob')
const Router = require('@koa/router')

const router = new Router()

const listRouter = ['admin', 'client', 'document', 'common']

listRouter.forEach((routerName) => {
    // bootstrap routes
    glob(`${__dirname}/${routerName}/*.js`, { ignore: '**/index.js' }, (err, matches) => {
        if (err) {
            throw err
        }

        matches.forEach((file) => {
            const controller = require(file) // eslint-disable-line
            console.log(typeof controller)

            router.use(`/${routerName}`, controller.routes()).use(controller.allowedMethods())
        })
    })
})

module.exports = router
