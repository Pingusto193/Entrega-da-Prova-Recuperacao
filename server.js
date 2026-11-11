import express from 'express'
import pool from './db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

const app = express()
const JWT_SECRET = process.env.JWT_SECRET || 'chave-local-da-prova-troque-antes-de-publicar'
app.use(express.json())
app.use(cookieParser())
app.get('/', (req, res) => res.redirect('/index.html'))
app.use(express.static('public'))

function authToken(req, res, next) {
  try {
    req.usuario = jwt.verify(req.cookies.token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ erro: 'Entre novamente na sua conta.' })
  }
}

app.post('/registro', async (req, res) => {
  const { nome, login, senha } = req.body
  if (typeof nome !== 'string' || !nome.trim() || nome.length > 100 ||
      typeof login !== 'string' || !login.trim() || login.length > 100 ||
      typeof senha !== 'string' || !senha || Buffer.byteLength(senha, 'utf8') > 72) {
    return res.status(400).json({ erro: 'Informe nome e login (até 100 caracteres) e senha (até 72 bytes).' })
  }
  const hash = await bcrypt.hash(senha, 10)
  const resultado = await pool.query(
    'INSERT INTO usuario (nome, login, senha) VALUES ($1, $2, $3) RETURNING id, nome, login',
    [nome.trim(), login.trim(), hash]
  )
  res.status(201).json(resultado.rows[0])
})

app.post('/login', async (req, res) => {
  const { login, senha } = req.body
  if (typeof login !== 'string' || typeof senha !== 'string') {
    return res.status(400).json({ erro: 'Informe login e senha.' })
  }
  const resultado = await pool.query('SELECT * FROM usuario WHERE login = $1', [login.trim()])
  const usuario = resultado.rows[0]
  if (!usuario || !await bcrypt.compare(senha, usuario.senha)) {
    return res.status(401).json({ erro: 'Login ou senha incorretos.' })
  }
  const token = jwt.sign({ id: usuario.id, nome: usuario.nome }, JWT_SECRET, { expiresIn: '1h' })
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 3600000 })
  res.json({ nome: usuario.nome })
})

app.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: false })
  res.json({ mensagem: 'Você saiu.' })
})
app.get('/me', authToken, (req, res) => res.json({ nome: req.usuario.nome }))

app.get('/tarefas', authToken, async (req, res) => {
  const resultado = await pool.query('SELECT id, titulo, descricao, id_usuario FROM tarefa WHERE id_usuario = $1 ORDER BY id', [req.usuario.id])
  res.json(resultado.rows)
})

function validarTarefa(req, res, next) {
  const { titulo, descricao } = req.body
  if (typeof titulo !== 'string' || !titulo.trim() || titulo.length > 200 ||
      typeof descricao !== 'string') {
    return res.status(400).json({ erro: 'Confira título e descrição.' })
  }
  next()
}
function validarId(req, res, next) {
  if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id)) || Number(req.params.id) < 1 || Number(req.params.id) > 2147483647) {
    return res.status(400).json({ erro: 'ID inválido.' })
  }
  next()
}
app.post('/tarefas', authToken, validarTarefa, async (req, res) => {
  const { titulo, descricao } = req.body
  const resultado = await pool.query(
    'INSERT INTO tarefa (titulo, descricao, id_usuario) VALUES ($1, $2, $3) RETURNING id, titulo, descricao, id_usuario',
    [titulo.trim(), descricao, req.usuario.id]
  )
  res.status(201).json(resultado.rows[0])
})
app.put('/tarefas/:id', authToken, validarId, validarTarefa, async (req, res) => {
  const { titulo, descricao } = req.body
  const resultado = await pool.query(
    'UPDATE tarefa SET titulo = $1, descricao = $2 WHERE id = $3 AND id_usuario = $4 RETURNING id, titulo, descricao, id_usuario',
    [titulo.trim(), descricao, req.params.id, req.usuario.id]
  )
  if (!resultado.rows.length) return res.status(404).json({ erro: 'Tarefa não encontrada.' })
  res.json(resultado.rows[0])
})
app.delete('/tarefas/:id', authToken, validarId, async (req, res) => {
  const resultado = await pool.query(
    'DELETE FROM tarefa WHERE id = $1 AND id_usuario = $2 RETURNING id',
    [req.params.id, req.usuario.id]
  )
  if (!resultado.rows.length) return res.status(404).json({ erro: 'Tarefa não encontrada.' })
  res.json({ mensagem: 'Tarefa excluída.' })
})
app.use((erro, req, res, next) => {
  if (erro.code === '23505') return res.status(409).json({ erro: 'Esse login já existe.' })
  if (erro.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' })
  console.error(erro.message)
  res.status(500).json({ erro: 'Erro no servidor. Confira o terminal e a conexão com o banco.' })
})
app.listen(3000, () => console.log('Abra http://localhost:3000'))
