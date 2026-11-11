async function abrirLista(usuario) {
  document.getElementById('acesso').hidden = true
  document.getElementById('areaLista').hidden = false
  document.getElementById('boasVindas').textContent = 'Lista de ' + usuario.nome
  await carregar()
}
document.getElementById('formLogin').onsubmit = async evento => {
  evento.preventDefault()
  try {
    const usuario = await chamarAPI('/login', 'POST', {
      login: document.getElementById('login').value,
      senha: document.getElementById('senha').value
    })
    document.getElementById('formLogin').reset()
    await abrirLista(usuario)
  } catch (erro) { alert(erro.message) }
}
document.getElementById('formCadastro').onsubmit = async evento => {
  evento.preventDefault()
  try {
    await chamarAPI('/registro', 'POST', {
      nome: document.getElementById('nomeCadastro').value,
      login: document.getElementById('loginCadastro').value,
      senha: document.getElementById('senhaCadastro').value
    })
    document.getElementById('login').value = document.getElementById('loginCadastro').value
    document.getElementById('formCadastro').reset()
    alert('Conta criada. Agora entre com seu login e senha.')
    document.getElementById('senha').focus()
  } catch (erro) { alert(erro.message) }
}
async function iniciar() {
  try {
    const resposta = await fetch('/me')
    if (resposta.status === 401) return
    if (!resposta.ok) throw new Error('Não foi possível verificar a conta.')
    await abrirLista(await resposta.json())
  } catch (erro) { alert(erro.message) }
}
iniciar()
