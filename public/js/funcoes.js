async function chamarAPI(url, metodo = 'GET', dados) {
  const resposta = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: dados === undefined ? undefined : JSON.stringify(dados)
  })
  const resultado = await resposta.json()
  if (!resposta.ok) {
    if (resposta.status === 401 && !['/login', '/registro'].includes(url)) location.href = '/index.html'
    throw new Error(resultado.erro || 'Erro na solicitação.')
  }
  return resultado
}
async function sair() {
  try {
    await chamarAPI('/logout', 'POST')
    location.href = '/index.html'
  } catch (erro) { alert(erro.message) }
}
