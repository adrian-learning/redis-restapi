const express = require('express')
const router = express.Router()
const mysql = require('../mysql').pool
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const loginMiddle = require('../middlewares/login')

router.post('/cadastrar', (req, res) => {   
    mysql.getConnection((err, conn) => {
        if(err) return res.status(500).send({error: err})

        bcrypt.hash(req.body.password.toString(), 10, (errBcrypt, hash) => {
            if(errBcrypt) return res.status(500).send({error: errBcrypt})

            conn.query(
                'INSERT INTO USUARIO (email, password) VALUES(?,?)',
                [req.body.email, hash],
                (errConn, results) => {
                    conn.release()
                    if(errConn){
                        if(errConn.errno == 1062) return res.status(401).send({mensagem: 'Email já cadastrado', error: errConn})
    
                        return res.status(500).send({error: errConn})
                    }

                    const response = {
                        mensagem: "Usuário registrado!",
                        usuario: {
                            id_usuario: results.insertId,
                            email: req.body.email
                        }
                    }

                    return res.status(200).send(response)
                }
            )
        })
    })
})

router.delete('/:id', loginMiddle,(req, res) => {
    mysql.getConnection((err, conn) => {
        if(err) return res.status(500).send({error: err})

        conn.query(
            'DELETE FROM USUARIO WHERE id_user = ?;',
            [req.params.id],
            (errConn, result) => {
                if(errConn) return res.status(500).send({error: errConn})
                console.log(result)

                return res.status(200).send({
                    mensagem: 'Usuário removido!'
                })
            }
        )
    })
})

router.post('/login', (req, res) => {
    mysql.getConnection((err, conn) => {
        if(err) return res.status(500).send({ error: err })

        conn.query(
            'SELECT * FROM USUARIO WHERE email = ?',
            [req.body.email],
            (errConn, result) => {
                if(errConn) return res.status(500).send({error: errConn})
                if(result.length == 0) return res.status(401).send({mensagem: 'Falha na autenticação'})

                bcrypt.compare(req.body.password.toString(), result[0].password).then((resultBcrypt) => {
                    if(!resultBcrypt) return res.status(401).send({mensagem: 'Falha na autenticação'})

                    const token = jwt.sign({
                        id_usuario: result[0].password,
                        email: result[0].email
                    },
                    process.env.JWT_KEY,
                    {
                        expiresIn: '1h'
                    })

                    return res.status(200).send({
                        mensagem: 'Autenticado com sucesso',
                        token: token
                    })
                })
            }
        )
    })
})

module.exports = router