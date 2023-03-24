const redis = require('redis')

const redisConfig = async () => {
    const clientRedis = redis.createClient({
        port: process.env.REDIS_PORT
    })

    clientRedis.on('error', (err) => console.log('Redis Client Error', err))
    clientRedis.on('connect', () => console.log('Conectado -> Redis'));

    await clientRedis.connect()

    return clientRedis
}

module.exports = redisConfig