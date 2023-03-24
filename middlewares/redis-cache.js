const getFromRedis = async (req, res, next) => {
    const path = req.originalUrl
    const redis_client = res.locals.redis_client

    const result = await redis_client.get(path.toString())

    if(!result) next()
    else
    res.send({
        fromCache: true,
        response: JSON.parse(result)
    })
}

module.exports = {
    getFromRedis
}