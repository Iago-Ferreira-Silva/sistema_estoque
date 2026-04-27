inicializarPagina();

let produtos   = [];
let editandoId = null;

function getStatus(qtdAtual, qtdMinima) {
  if (qtdAtual === 0)              return { label: 'Sem estoque', cls: 'badge-danger' };
  if (qtdAtual <= qtdMinima)       return { label: 'Crítico',     cls: 'badge-danger' };
  if (qtdAtual <= qtdMinima * 1.5) return { label: 'Atenção',     cls: 'badge-warning' };
  return                                  { label: 'Normal',      cls: 'badge-ok' };
}

const categorias = { limpeza: 'Limpeza', escritorio: 'Escritório', higiene: 'Higiene' };

async function carregarProdutos() {
  mostrarLoading('produtosBody', 7);
  try {
    const r = await fetch('http://localhost:3000/api/produtos', { headers: getHeaders() });
    produtos = await r.json();
    filtrar();
  } catch (err) {
    mostrarErroTabela('produtosBody', 7);
  }
}

function renderTabela(lista) {
  const tbody = document.getElementById('produtosBody');
  const empty = document.getElementById('tableEmpty');

  if (lista.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  tbody.innerHTML = lista.map(p => {
    const s = getStatus(p.qtd_atual, p.qtd_minima);
    return `
      <tr>
        <td><strong>${p.nome}</strong></td>
        <td>${categorias[p.categoria] || p.categoria}</td>
        <td>${p.unidade}</td>
        <td>${p.qtd_atual}</td>
        <td>${p.qtd_minima}</td>
        <td><span class="badge ${s.cls}">${s.label}</span></td>
        <td class="actions-cell">
          <button class="btn-edit"   onclick="abrirEdicao(${p.id})">Editar</button>
          <button class="btn-delete" onclick="excluirProduto(${p.id})">Excluir</button>
        </td>
      </tr>`;
  }).join('');
}

function filtrar() {
  const termo = document.getElementById('searchInput').value.toLowerCase();
  const cat   = document.getElementById('filterCategoria').value;
  renderTabela(produtos.filter(p =>
    p.nome.toLowerCase().includes(termo) && (cat === '' || p.categoria === cat)
  ));
}

document.getElementById('searchInput').addEventListener('input', filtrar);
document.getElementById('filterCategoria').addEventListener('change', filtrar);

// Modal
const overlay = document.getElementById('modalOverlay');

function fecharModal() {
  overlay.hidden = true;
  editandoId = null;
  ['nomeProduto','qtdAtual','qtdMinima','descricao'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('categoria').value = '';
  document.getElementById('unidade').value   = 'un';
}

document.getElementById('btnNovoProduto').addEventListener('click', () => {
  document.getElementById('modalTitle').textContent = 'Novo Produto';
  fecharModal();
  overlay.hidden = false;
});

document.getElementById('modalClose').addEventListener('click', fecharModal);
document.getElementById('btnCancelar').addEventListener('click', fecharModal);
overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });

document.getElementById('btnSalvar').addEventListener('click', async () => {
  const dados = {
    nome:       document.getElementById('nomeProduto').value.trim(),
    categoria:  document.getElementById('categoria').value,
    unidade:    document.getElementById('unidade').value,
    qtd_atual:  Number(document.getElementById('qtdAtual').value) || 0,
    qtd_minima: Number(document.getElementById('qtdMinima').value) || 0,
    descricao:  document.getElementById('descricao').value.trim(),
  };

  if (!dados.nome || !dados.categoria) {
    alert('Preencha o nome e a categoria.');
    return;
  }

  try {
    const url    = editandoId ? `http://localhost:3000/api/produtos/${editandoId}` : 'http://localhost:3000/api/produtos';
    const method = editandoId ? 'PUT' : 'POST';
    await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(dados) });
    mostrarToast(editandoId ? 'Produto atualizado!' : 'Produto cadastrado!');
    fecharModal();
    await carregarProdutos();
  } catch {
    mostrarToast('Erro ao salvar produto.', 'error');
  }
});

function abrirEdicao(id) {
  const p = produtos.find(p => p.id === id);
  if (!p) return;
  editandoId = id;
  document.getElementById('modalTitle').textContent = 'Editar Produto';
  document.getElementById('nomeProduto').value = p.nome;
  document.getElementById('categoria').value   = p.categoria;
  document.getElementById('unidade').value     = p.unidade;
  document.getElementById('qtdAtual').value    = p.qtd_atual;
  document.getElementById('qtdMinima').value   = p.qtd_minima;
  document.getElementById('descricao').value   = p.descricao || '';
  overlay.hidden = false;
}

async function excluirProduto(id) {
  if (!confirm('Deseja excluir este produto?')) return;
  try {
    await fetch(`http://localhost:3000/api/produtos/${id}`, {
      method: 'DELETE', headers: getHeaders(),
    });
    mostrarToast('Produto excluído.');
    await carregarProdutos();
  } catch {
    mostrarToast('Erro ao excluir.', 'error');
  }
}

// Funções de feedback visual
function mostrarToast(msg, tipo = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function mostrarErroTabela(tbodyId, colunas) {
  document.getElementById(tbodyId).innerHTML = `
    <tr>
      <td colspan="${colunas}" style="text-align:center; color: var(--color-danger); padding: 24px;">
        Erro ao carregar dados. Verifique se o servidor está rodando.
      </td>
    </tr>`;
}

carregarProdutos();