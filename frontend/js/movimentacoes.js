// USUÁRIO E SIDEBAR
const usuario = JSON.parse(localStorage.getItem('usuario'));
if (!usuario) window.location.href = './login.html';

document.querySelector('.user-name').textContent = usuario.nome;
document.querySelector('.user-role').textContent = usuario.perfil;
document.querySelector('.user-avatar').textContent = usuario.nome
  .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

document.getElementById('currentDate').textContent = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
});

document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

document.getElementById('btnLogout')?.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = './login.html';
});

// ESTADO
let movimentacoes = [];
let produtos = [];
let setores  = [];
const token = localStorage.getItem('token');
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
};
const hoje = new Date().toLocaleDateString('pt-BR');

// CARREGAR DADOS DA API
async function carregarDados() {
  try {
    const [resMov, resProd, resSeto] = await Promise.all([
      fetch('http://localhost:3000/api/movimentacoes', { headers }),
      fetch('http://localhost:3000/api/produtos',      { headers }),
      fetch('http://localhost:3000/api/setores',       { headers }),
    ]);

    movimentacoes = await resMov.json();
    produtos      = await resProd.json();
    setores       = await resSeto.json();

    popularSelects();
    atualizarResumo();
    filtrar();
  } catch (err) {
    console.error('Erro ao carregar movimentações:', err);
  }
}

// POPULAR SELECTS DO MODAL
function popularSelects() {
  const selectProduto = document.getElementById('produtoMov');
  const selectSetor   = document.getElementById('setorMov');

  selectProduto.innerHTML = '<option value="">Selecione...</option>' +
    produtos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');

  selectSetor.innerHTML = '<option value="">Selecione...</option>' +
    setores.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
}

// RESUMO DO DIA
function atualizarResumo() {
  const entradasHoje = movimentacoes.filter(m =>
    m.tipo === 'entrada' &&
    new Date(m.criado_em).toLocaleDateString('pt-BR') === hoje
  ).length;

  const saidasHoje = movimentacoes.filter(m =>
    m.tipo === 'saida' &&
    new Date(m.criado_em).toLocaleDateString('pt-BR') === hoje
  ).length;

  document.getElementById('entradasHoje').textContent = entradasHoje;
  document.getElementById('saidasHoje').textContent   = saidasHoje;
  document.getElementById('totalMov').textContent     = movimentacoes.length;
}

// RENDERIZAR TABELA
function renderTabela(lista) {
  const tbody = document.getElementById('movBody');
  const empty = document.getElementById('tableEmpty');

  if (lista.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  tbody.innerHTML = lista.map(m => `
    <tr>
      <td><strong>${m.produto}</strong></td>
      <td>
        <span class="badge ${m.tipo === 'entrada' ? 'badge-in' : 'badge-out'}">
          ${m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
        </span>
      </td>
      <td>${m.quantidade}</td>
      <td>${m.setor}</td>
      <td>${m.responsavel}</td>
      <td>${m.observacao || '—'}</td>
      <td>${new Date(m.criado_em).toLocaleDateString('pt-BR')}</td>
    </tr>
  `).join('');
}

// FILTRAR
function filtrar() {
  const termo = document.getElementById('searchInput').value.toLowerCase();
  const tipo  = document.getElementById('filterTipo').value;
  const data  = document.getElementById('filterData').value;

  const lista = movimentacoes.filter(m => {
    const textoOk = m.produto.toLowerCase().includes(termo) || m.setor.toLowerCase().includes(termo);
    const tipoOk  = tipo === '' || m.tipo === tipo;
    const dataOk  = data === '' ||
      new Date(m.criado_em).toLocaleDateString('pt-BR') ===
      new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
    return textoOk && tipoOk && dataOk;
  });

  renderTabela(lista);
}

document.getElementById('searchInput').addEventListener('input', filtrar);
document.getElementById('filterTipo').addEventListener('change', filtrar);
document.getElementById('filterData').addEventListener('change', filtrar);

// MODAL
const overlay = document.getElementById('modalOverlay');

function fecharModal() {
  overlay.hidden = true;
  limparForm();
}

function limparForm() {
  document.getElementById('produtoMov').value     = '';
  document.getElementById('quantidade').value     = '';
  document.getElementById('setorMov').value       = '';
  document.getElementById('responsavelMov').value = '';
  document.getElementById('observacao').value     = '';
  document.getElementById('tipoMov').value        = 'entrada';
  document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btnEntrada').classList.add('active');
}

document.getElementById('btnNovaMovimentacao').addEventListener('click', () => {
  overlay.hidden = false;
});
document.getElementById('modalClose').addEventListener('click', fecharModal);
document.getElementById('btnCancelar').addEventListener('click', fecharModal);
overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });

document.querySelectorAll('.tipo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tipoMov').value = btn.dataset.tipo;
  });
});

// SALVAR
document.getElementById('btnSalvar').addEventListener('click', async () => {
  const dados = {
    produto_id:  Number(document.getElementById('produtoMov').value),
    setor_id:    Number(document.getElementById('setorMov').value),
    tipo:        document.getElementById('tipoMov').value,
    quantidade:  Number(document.getElementById('quantidade').value),
    observacao:  document.getElementById('observacao').value.trim(),
  };

  if (!dados.produto_id || !dados.setor_id || dados.quantidade < 1) {
    alert('Preencha produto, setor e quantidade.');
    return;
  }

  try {
    await fetch('http://localhost:3000/api/movimentacoes', {
      method: 'POST', headers, body: JSON.stringify(dados),
    });

    fecharModal();
    await carregarDados();
  } catch (err) {
    alert('Erro ao registrar movimentação.');
  }
});

// INICIALIZAÇÃO
carregarDados();