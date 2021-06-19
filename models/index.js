const Redis = require('ioredis')
const ms = require('ms')

const { env } = process

const knex = require('knex')({
    client: 'mysql2',
    connection: env.MARIADB_MASTER_URL,
})

const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    db: env.REDIS_DB || 1,
    password: env.REDIS_PASSWORD,
    keyPrefix: env.REDIS_PREFIX,
})

async function cachedExecute({ key, ttl = 60, json = false }, fn) {
    if (!(typeof ttl === 'number') && !(typeof ttl === 'string')) {
        throw new TypeError(`expecting ttl to be number (second) or string, got ${typeof ttl}`)
    }

    let t2l = ttl
    if (typeof ttl === 'string') {
        t2l = ms(ttl) / 1000
    }

    const cached = await redis.get(key)
    if (!cached) {
        const val = await fn()
        redis.setex(key, t2l, json ? JSON.stringify(val) : val)

        return val
    }

    return json ? JSON.parse(cached) : cached
}

// lua scripts
redis.defineCommand('flushpattern', {
    numberOfKeys: 0,
    lua: `
        local keys = redis.call('keys', ARGV[1])
        for i=1,#keys,5000 do
            redis.call('del', unpack(keys, i, math.min(i+4999, #keys)))
        end
        return keys
    `,
})

redis.cachedExecute = cachedExecute

module.exports = { redis, knex }
