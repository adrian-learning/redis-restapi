const express = require('express')
const router = express.Router()
const mysql = require('../mysql').pool
const multer = require('multer')
const loginMiddle = require('../middlewares/login')
const { getFromRedis } = require('../middlewares/redis-cache')


router.get('/', getFromRedis, (req,res) => {
    mysql.getConnection((err, conn) => {
        if(err){ return res.status(500).send({error: error})}

        conn.query(
            'SELECT * FROM PRODUTO;',
            async (err, result, field) => {
                conn.release()
                if(err){
                    return res.status(500).send({
                        error: err,
                        response: null
                    })
                }

                const response = {
                    mensagem: "Lista de todos produtos",
                    quantidade: result.length,
                    produtos: result.map(item => {
                        return {
                            id_produto: item.id_produto,
                            nome: item.nome,
                            preco: item.preco,
                            imagem_produto: item.imagem_produto,
                            request: {
                                tipo: 'GET',
                                descricao: 'Retorna o produto',
                                url: `http://localhost:4000/produtos/${item.id_produto}`
                            }
                        }
                    })
                }


                const redis_client = res.locals.redis_client
                const path = req.originalUrl
                await redis_client.set(path.toString(), JSON.stringify(response))

                res.status(200).send({
                    fromCache: false,
                    response:  response
                })
            }
        )
    })
})

router.get('/:id_produto', getFromRedis, (req,res) => {
    mysql.getConnection((err, conn) => {
        if(err){ return res.status(500).send({error: error})}

        conn.query(
            'SELECT * FROM PRODUTO WHERE id_produto = ?;',
            [parseInt(req.params.id_produto)],
            async (err, result, field) => {
                conn.release()
                if(err){
                    return res.status(500).send({
                        error: err,
                        response: null
                    })
                }

                if(result.length == 0) {
                    return res.status(404).send({ mensagem: "Produto não encontrado"})
                }

                const response = {
                    mensagem: "Produto por ID",
                    produto: {
                        id_produto: result[0].id_produto,
                        nome: result[0].nome,
                        preco: result[0].preco,
                        imagem_produto: reuslt[0].imagem_produto,
                        request: {
                            tipo: 'GET',
                            descricao: 'Retorna todos produtos',
                            url: `http://localhost:4000/produtos`
                        }
                    }
                }

                const redis_client = res.locals.redis_client
                const path = req.originalUrl
                await redis_client.set(path.toString(), JSON.stringify(response))

                res.status(200).send({
                    fromCache: false,
                    response:  response
                })
            }
        )
    })
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {cb(null, './upload/')},
    filename: (req, file, cb) => { cb(null, new Date().toISOString() + file.originalname) }
})

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') return cb(null, true)
    
    return cb(null, false)
}

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5  //5mb
    },
    fileFilter: fileFilter
 })

router.post('/', loginMiddle, upload.single('produto_imagem') ,(req, res) => {
    console.log(req.file)
    mysql.getConnection((err,conn) => {
        if(err){ return res.status(500).send({error: error}) }

        conn.query(
            'INSERT INTO PRODUTO (nome,preco,imagem_produto) VALUES (?,?,?);',
            [req.body.name, req.body.preco, req.file.path],
            (err, result, field) => {
                conn.release()

                if(err){
                    return res.status(500).send({
                        error: err,
                        response: null
                    })
                }


                const response = {
                    mensagem: "Produto inserido",
                    produto: {
                        id_produto: result.insertId,
                        nome: req.body.name,
                        preco: req.body.preco,
                        imagem_produto: req.file.path,
                        request: {
                            tipo: 'POST',
                            descricao: 'Retorna todos produtos',
                            url: `http://localhost:4000/produtos`
                        }
                    }
                }

                res.send(response)
            }
        )
    })
    
})

router.delete('/:id_produto', loginMiddle, (req, res) => {
    mysql.getConnection((err, conn) => {
        if(err){ return res.status(500).send({error: error})}

        conn.query(
            'DELETE FROM PRODUTO WHERE id_produto = ?',
            [parseInt(req.params.id_produto)],
            (err, resultado, field) => {
                conn.release()
                if(err){
                    return res.status(500).send({
                        error: err,
                        response: null
                    })
                }

                const response = {
                    mensagem: "Produto removido"
                }

                res.status(200).send(response)
            }
        )
    })
})


module.exports = router