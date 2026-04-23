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
let setores = [];
let editandoId = null;
const token = localStorage.getItem('token');
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
};

// CARREGAR SETORES DA API
async function carregarSetores() {
  try {
    const response = await fetch('http://localhost:3000/api/setores', { headers });
    setores = await response.json();
    filtrar();
  } catch (err) {
    console.error('Erro ao carregar setores:', err);
  }
}

// RENDERIZAR TABELA
function renderTabela(lista) {
  const tbody = document.getElementById('setoresBody');
  const empty = document.getElementById('tableEmpty');

  if (lista.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  tbody.innerHTML = lista.map(s => `
    <tr>
      <td><strong>${s.nome}</strong></td>
      <td>${s.responsavel || '—'}</td>
      <td>${s.descricao  || '—'}</td>
      <td><span class="badge badge-in">Vinculado</span></td>
      <td class="actions-cell">
        <button class="btn-edit"   onclick="abrirEdicao(${s.id})">Editar</button>
        <button class="btn-delete" onclick="excluirSetor(${s.id})">Excluir</button>
      </td>
    </tr>
  `).join('');
}

// FILTRAR
function filtrar() {
  const termo = document.getElementById('searchInput').value.toLowerCase();
  renderTabela(setores.filter(s => s.nome.toLowerCase().includes(termo)));
}

document.getElementById('searchInput').addEventListener('input', filtrar);

// MODAL
const overlay = document.getElementById('modalOverlay');

function fecharModal() {
  overlay.hidden = true;
  editandoId = null;
  document.getElementById('nomeSetor').value      = '';
  document.getElementById('responsavel').value    = '';
  document.getElementById('descricaoSetor').value = '';
}

document.getElementById('btnNovoSetor').addEventListener('click', () => {
  document.getElementById('modalTitle').textContent = 'Novo Setor';
  overlay.hidden = false;
});
document.getElementById('modalClose').addEventListener('click', fecharModal);
document.getElementById('btnCancelar').addEventListener('click', fecharModal);
overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });

// SALVAR
document.getElementById('btnSalvar').addEventListener('click', async () => {
  const dados = {
    nome:       document.getElementById('nomeSetor').value.trim(),
    responsavel: document.getElementById('responsavel').value.trim(),
    descricao:  document.getElementById('descricaoSetor').value.trim(),
  };

  if (!dados.nome) {
    alert('Informe o nome do setor.');
    return;
  }

  try {
    if (editandoId !== null) {
      await fetch(`http://localhost:3000/api/setores/${editandoId}`, {
        method: 'PUT', headers, body: JSON.stringify(dados),
      });
    } else {
      await fetch('http://localhost:3000/api/setores', {
        method: 'POST', headers, body: JSON.stringify(dados),
      });
    }

    fecharModal();
    await carregarSetores();
  } catch (err) {
    alert('Erro ao salvar setor.');
  }
});

// EDITAR
function abrirEdicao(id) {
  const s = setores.find(s => s.id === id);
  if (!s) return;

  editandoId = id;
  document.getElementById('modalTitle').textContent = 'Editar Setor';
  document.getElementById('nomeSetor').value      = s.nome;
  document.getElementById('responsavel').value    = s.responsavel || '';
  document.getElementById('descricaoSetor').value = s.descricao  || '';
  overlay.hidden = false;
}

// EXCLUIR
async function excluirSetor(id) {
  if (!confirm('Deseja excluir este setor?')) return;
  try {
    await fetch(`http://localhost:3000/api/setores/${id}`, {
      method: 'DELETE', headers,
    });
    await carregarSetores();
  } catch (err) {
    alert('Erro ao excluir setor.');
  }
}

// INICIALIZAÇÃO
carregarSetores();