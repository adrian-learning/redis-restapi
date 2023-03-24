require('dotenv').config()
const morgan = require('morgan')
const express = require('express')
const app = express()
const redis = require('redis')
const redisConfig = require('./config/redis')

app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use('/upload', express.static('upload'))

//Redis start
app.use(async (req, res, next) => {
    const clientRedis = await redisConfig()
    res.locals.redis_client = clientRedis
    next()
})

//Import Routes
const produtosRota = require('./routes/produtos')
const pedidosRota = require('./routes/pedidos')
const usuariosRota = require('./routes/usuarios')

//Define Routes
app.use('/produtos', produtosRota)
app.use('/pedidos', pedidosRota)
app.use('/usuarios', usuariosRota)

app.use((req, res, next) => {
    const error = new Error('Not found')
    error.status = 404
    next(error)
})

app.use((error, req, res, next) => {
    res.status = error.status || 500
    res.send({
        error: {
            message: error.message
        }
    })
})

app.listen(process.env.PORT, () => {
    console.log(`Api Executando na porta http://localhost:${process.env.PORT}`)
})