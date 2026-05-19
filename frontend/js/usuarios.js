inicializarPagina();

// ESTADO
const usuarioLogado = JSON.parse(localStorage.getItem('usuario'));
let usuarios   = [];
let setores    = [];
let editandoId = null;

const perfilLabel = {
  gestor:      'Gestor',
  coordenador: 'Coordenador',
  secretario:  'Secretário',
  agente:      'Agente Administrativo',
};

function iniciais(nome) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

// CARREGAR DADOS DA API
async function carregarDados() {
  try {
    const [resUsu, resSeto] = await Promise.all([
      fetch('http://localhost:3000/api/usuarios', { headers: getHeaders() }),
      fetch('http://localhost:3000/api/setores',  { headers: getHeaders() }),
    ]);

    usuarios = await resUsu.json();
    setores  = await resSeto.json();

    popularSetores();
    filtrar();
  } catch (err) {
    console.error('Erro ao carregar usuários:', err);
  }
}

// POPULAR SELECT DE SETORES
function popularSetores() {
  const select = document.getElementById('setorUsuario');
  select.innerHTML = '<option value="">Selecione...</option>' +
    setores.map(s => `<option value="${s.nome}">${s.nome}</option>`).join('');
}

// RENDERIZAR CARDS
function renderCards(lista) {
  const grid  = document.getElementById('usuariosGrid');
  const empty = document.getElementById('tableEmpty');

  if (lista.length === 0) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  grid.innerHTML = lista.map(u => `
    <div class="usuario-card">
      <div class="usuario-card-header">
        <div class="usuario-avatar-card avatar-${u.perfil}">
          ${iniciais(u.nome)}
        </div>
        <div class="usuario-info">
          <p class="usuario-nome">${u.nome}</p>
          <p class="usuario-email">${u.email}</p>
        </div>
      </div>
      <div class="usuario-card-body">
        <div class="usuario-meta">
          <span class="usuario-meta-label">Perfil</span>
          <span class="badge badge-${u.perfil}">${perfilLabel[u.perfil] || u.perfil}</span>
        </div>
        <div class="usuario-meta">
          <span class="usuario-meta-label">Setor</span>
          <span class="usuario-meta-value">${u.setor || '—'}</span>
        </div>
        <div class="usuario-meta">
          <span class="usuario-meta-label">Status</span>
          <span class="status-dot status-${u.ativo ? 'ativo' : 'inativo'}">
            ${u.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>
      <div class="usuario-card-footer">
        <button class="btn-edit" style="flex:1" onclick="abrirEdicao(${u.id})">Editar</button>
        <button class="btn-delete" onclick="toggleStatus(${u.id})">
          ${u.ativo ? 'Desativar' : 'Ativar'}
        </button>
      </div>
    </div>
  `).join('');
}

// FILTRAR
function filtrar() {
  const termo  = document.getElementById('searchInput').value.toLowerCase();
  const perfil = document.getElementById('filterPerfil').value;

  const lista = usuarios.filter(u => {
    const textoOk  = u.nome.toLowerCase().includes(termo) ||
                     u.email.toLowerCase().includes(termo);
    const perfilOk = perfil === '' || u.perfil === perfil;
    return textoOk && perfilOk;
  });

  renderCards(lista);
}

document.getElementById('searchInput').addEventListener('input', filtrar);
document.getElementById('filterPerfil').addEventListener('change', filtrar);

// TOGGLE STATUS
async function toggleStatus(id) {
  try {
    await fetch(`http://localhost:3000/api/usuarios/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    mostrarToast('Status do usuário atualizado!');
    await carregarDados();
  } catch (err) {
    mostrarToast('Erro ao atualizar status.', 'error');
  }
}

// MODAL
const overlay = document.getElementById('modalOverlay');

function fecharModal() {
  overlay.hidden = true;
  editandoId = null;
  document.getElementById('nomeUsuario').value          = '';
  document.getElementById('emailUsuario').value         = '';
  document.getElementById('perfilUsuario').value        = '';
  document.getElementById('setorUsuario').value         = '';
  document.getElementById('senhaUsuario').value         = '';
  document.getElementById('confirmarSenha').value       = '';
  document.getElementById('senhaGroup').hidden          = false;
  document.getElementById('confirmarSenhaGroup').hidden = true;
  document.getElementById('senhaAviso').hidden          = true;
  document.getElementById('senhaLabel').textContent     = 'Senha provisória';
}

document.getElementById('btnNovoUsuario').addEventListener('click', () => {
  document.getElementById('modalTitle').textContent     = 'Novo Usuário';
  document.getElementById('senhaGroup').hidden          = false;
  document.getElementById('confirmarSenhaGroup').hidden = true;
  document.getElementById('senhaAviso').hidden          = true;
  document.getElementById('senhaLabel').textContent     = 'Senha provisória';
  overlay.hidden = false;
});

document.getElementById('modalClose').addEventListener('click', fecharModal);
document.getElementById('btnCancelar').addEventListener('click', fecharModal);
overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });

// EDITAR
function abrirEdicao(id) {
  const u = usuarios.find(u => u.id === id);
  if (!u) return;

  editandoId = id;
  document.getElementById('modalTitle').textContent     = 'Editar Usuário';
  document.getElementById('nomeUsuario').value          = u.nome;
  document.getElementById('emailUsuario').value         = u.email;
  document.getElementById('perfilUsuario').value        = u.perfil;
  document.getElementById('setorUsuario').value         = u.setor || '';
  document.getElementById('senhaUsuario').value         = '';
  document.getElementById('confirmarSenha').value       = '';
  document.getElementById('senhaLabel').textContent     = 'Nova senha (opcional)';
  document.getElementById('confirmarSenhaGroup').hidden = false;
  document.getElementById('senhaAviso').hidden          = false;
  overlay.hidden = false;
}

// SALVAR
document.getElementById('btnSalvar').addEventListener('click', async () => {
  const nome      = document.getElementById('nomeUsuario').value.trim();
  const email     = document.getElementById('emailUsuario').value.trim();
  const perfil    = document.getElementById('perfilUsuario').value;
  const setor     = document.getElementById('setorUsuario').value;
  const senha     = document.getElementById('senhaUsuario').value;
  const confirmar = document.getElementById('confirmarSenha').value;

  if (!nome || !email || !perfil || !setor) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  if (editandoId === null && senha.length < 8) {
    alert('A senha deve ter no mínimo 8 caracteres.');
    return;
  }

  if (editandoId !== null && senha.length > 0) {
    if (senha.length < 8) {
      alert('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      alert('As senhas não coincidem.');
      return;
    }
  }

  const dados = { nome, email, perfil, setor };
  if (senha.length >= 8) dados.senha = senha;

  try {
    if (editandoId !== null) {
      await fetch(`http://localhost:3000/api/usuarios/${editandoId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(dados),
      });
    } else {
      await fetch('http://localhost:3000/api/usuarios', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dados),
      });
    }

    mostrarToast(editandoId ? 'Usuário atualizado!' : 'Usuário cadastrado!');
    fecharModal();
    await carregarDados();
  } catch (err) {
    mostrarToast('Erro ao salvar usuário.', 'error');
  }
});

// INICIALIZAÇÃO
carregarDados();