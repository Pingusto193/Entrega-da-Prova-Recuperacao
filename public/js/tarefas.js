let registros = []
async function carregar() {
  registros = await chamarAPI('/tarefas')
  const lista = document.getElementById('lista')
  lista.textContent = ''
  if (!registros.length) lista.textContent = 'Nenhuma tarefa.'
  registros.forEach(r => {
    const linha = document.createElement('p')
    const texto = document.createElement('span')
    texto.textContent = r.titulo + ' - ' + r.descricao + ' '
    const editarBotao = document.createElement('button')
    editarBotao.textContent = 'Editar'
    editarBotao.onclick = () => editar(r.id)
    const excluirBotao = document.createElement('button')
    excluirBotao.textContent = 'Excluir'
    excluirBotao.onclick = () => excluir(r.id)
    linha.append(texto, editarBotao, ' ', excluirBotao)
    lista.appendChild(linha)
  })
}
function limpar() {
  document.getElementById('formulario').reset()
  document.getElementById('id').value = ''
}
function editar(id) {
  const r = registros.find(r => r.id === id)
  document.getElementById('id').value = r.id
  document.getElementById('titulo').value = r.titulo
  document.getElementById('descricao').value = r.descricao
}
async function excluir(id) {
  if (!confirm('Excluir esta tarefa?')) return
  try {
    await chamarAPI('/tarefas/' + id, 'DELETE')
    if (document.getElementById('id').value === String(id)) limpar()
    await carregar()
  } catch (erro) { alert(erro.message) }
}
document.getElementById('formulario').onsubmit = async evento => {
  evento.preventDefault()
  const id = document.getElementById('id').value
  const dados = {
    titulo: document.getElementById('titulo').value,
    descricao: document.getElementById('descricao').value
  }
  try {
    await chamarAPI(id ? '/tarefas/' + id : '/tarefas', id ? 'PUT' : 'POST', dados)
    limpar()
    await carregar()
  } catch (erro) { alert(erro.message) }
}
