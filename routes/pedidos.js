const express = require('express')
const router = express.Router()
const mysql = require('../mysql').pool
const { getFromRedis } = require('../middlewares/redis-cache')

router.get('/', getFromRedis,(req,res) => {
    mysql.getConnection((err, conn) => {
        if(err){ return res.status(500).send({error: error})}

        conn.query(
            `SELECT PD.id_pedido, PD.quantidade, PR.id_produto, PR.nome as prod_nome, PR.preco as prod_preco
            FROM PEDIDO PD INNER JOIN PRODUTO PR ON PD.id_produto = PR.id_produto;`,
            async (err, result, field) => {
                conn.release()
                if(err){
                    return res.status(500).send({
                        error: err,
                        response: null
                    })
                }

                const response = {
                    mensagem: "Lista de todos pedidos",
                    quantidade: result.length,
                    produtos: result.map(item => {
                        return {
                            id_pedido: item.id_pedido,
                            quantidade: item.quantidade,
                            produto: {
                                id_produto: item.id_produto,
                                nome: item.prod_nome,
                                preco: item.prod_preco
                            },
                            request: {
                                tipo: 'GET',
                                descricao: 'Retorna o produto',
                                url: `http://localhost:4000/pedidos/${item.id_pedido}`
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

router.get('/:id_pedido', (req,res) => {
    mysql.getConnection((err, conn) => {
        if(err){ return res.status(500).send({error: error})}

        conn.query(
            'SELECT * FROM PEDIDO WHERE id_pedido = ?;',
            [parseInt(req.params.id_pedido)],
            async (err, result, field) => {
                conn.release()
                if(err){
                    return res.status(500).send({
                        error: err,
                        response: null
                    })
                }

                if(result.length == 0) {
                    return res.status(404).send({ mensagem: "Pedido não encontrado"})
                }

                const response = {
                    mensagem: "Pedido por ID",
                    produto: {
                        id_pedido: result[0].id_pedido,
                        id_produto: result[0].id_produto,
                        quantidade: result[0].quantidade,
                        request: {
                            tipo: 'GET',
                            descricao: 'Retorna todos pedidos',
                            url: `http://localhost:4000/pedidos`
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

router.post('/', (req, res) => {
    mysql.getConnection((err,conn) => {
        if(err){ return res.status(500).send({error: error}) }
        conn.query(
            'SELECT * FROM PRODUTO WHERE id_produto=?;',
            [req.body.id_produto],
            (err, result, field) => {
                if(err){ return res.status(500).send({ error: err }) }
                if(result.length == 0) {
                    return res.status(404).send({ mensagem: "Pedido não exite"})
                }

                conn.query(
                    'INSERT INTO PEDIDO (id_produto,quantidade) VALUES (?,?);',
                    [req.body.id_produto, req.body.quantidade],
                    (err, result, field) => {
                        conn.release()
                        if(err){ return res.status(500).send({ error: err }) }
        
                        const response = {
                            mensagem: "Pedido inserido",
                            produto: {
                                id_pedido: result.id_pedido,
                                id_produto: result.id_produto,
                                quantidade: result.quantidade,
                                request: {
                                    tipo: 'POST',
                                    descricao: 'Retorna todos produtos',
                                    url: `http://localhost:4000/pedidos`
                                }
                            }
                        }
        
                        res.send(response)
                    }
                )
            }
        )

        
    })
    
})

router.delete('/:id_pedido', (req, res) => {
    mysql.getConnection((err, conn) => {
        if(err){ return res.status(500).send({error: error})}

        conn.query(
            'DELETE FROM PEDIDO WHERE id_pedido = ?',
            [parseInt(req.params.id_pedido)],
            (err, resultado, field) => {
                conn.release()
                if(err){
                    return res.status(500).send({
                        error: err,
                        response: null
                    })
                }

                const response = {
                    mensagem: "Pedido removido"
                }

                res.status(200).send(response)
            }
        )
    })
})


module.exports = router