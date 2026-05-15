// CONFIGURAÇÃO BASE
const API_URL = 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('token');
}

function getHeaders() {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Redireciona para login se token expirar
function handleUnauthorized(status) {
  if (status === 401 || status === 403) {
    localStorage.removeItem('token');
    window.location.href = './login.html';
  }
}

// FUNÇÃO BASE DE REQUISIÇÃO
async function request(method, endpoint, body = null) {
  const options = {
    method,
    headers: getHeaders(),
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${endpoint}`, options);
  handleUnauthorized(response.status);

  const data = await response.json();

  if (!response.ok) throw new Error(data.message || 'Erro na requisição.');

  return data;
}

// MÉTODOS HTTP
const api = {
  get:    (endpoint)        => request('GET',    endpoint),
  post:   (endpoint, body)  => request('POST',   endpoint, body),
  put:    (endpoint, body)  => request('PUT',    endpoint, body),
  patch:  (endpoint, body)  => request('PATCH',  endpoint, body),
  delete: (endpoint)        => request('DELETE', endpoint),
};

// ENDPOINTS POR RECURSO
// AUTH
api.auth = {
  login: (email, senha) => request('POST', '/auth/login', { email, senha }, false),
};

// PRODUTOS
api.produtos = {
  listar:    ()        => api.get('/produtos'),
  criar:     (dados)   => api.post('/produtos', dados),
  atualizar: (id, dados) => api.put(`/produtos/${id}`, dados),
  excluir:   (id)      => api.delete(`/produtos/${id}`),
};

// SETORES
api.setores = {
  listar:    ()          => api.get('/setores'),
  criar:     (dados)     => api.post('/setores', dados),
  atualizar: (id, dados) => api.put(`/setores/${id}`, dados),
  excluir:   (id)        => api.delete(`/setores/${id}`),
};

// MOVIMENTAÇÕES
api.movimentacoes = {
  listar: ()      => api.get('/movimentacoes'),
  criar:  (dados) => api.post('/movimentacoes', dados),
};

// SOLICITAÇÕES
api.solicitacoes = {
  listar:         ()           => api.get('/solicitacoes'),
  criar:          (dados)      => api.post('/solicitacoes', dados),
  atualizarStatus: (id, status) => api.patch(`/solicitacoes/${id}/status`, { status }),
};

// USUÁRIOS
api.usuarios = {
  listar:       ()          => api.get('/usuarios'),
  criar:        (dados)     => api.post('/usuarios', dados),
  atualizar:    (id, dados) => api.put(`/usuarios/${id}`, dados),
  toggleStatus: (id)        => api.patch(`/usuarios/${id}/status`),
};