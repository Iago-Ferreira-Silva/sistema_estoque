inicializarPagina();

let produtos   = [];
let editandoId = null;

// UTILITÁRIOS
function getStatus(qtdAtual, qtdMinima) {
  const atual  = Number(qtdAtual);
  const minima = Number(qtdMinima);

  if (atual === 0)             return { label: 'Sem estoque', cls: 'badge-danger' };
  if (atual <= minima)         return { label: 'Crítico',     cls: 'badge-danger' };
  if (atual <= minima * 1.5)   return { label: 'Atenção',     cls: 'badge-warning' };
  return                              { label: 'Normal',      cls: 'badge-ok' };
}

const categorias = {
  limpeza:    'Limpeza',
  escritorio: 'Escritório',
  higiene:    'Higiene',
};

const unidadeNome = {
  un:  'Unidade',
  cx:  'Caixa',
  pct: 'Pacote',
  lt:  'Litro',
  kg:  'Quilo',
};

function formatarQtd(qtd, unidadeMin) {
  return `${Number(qtd).toLocaleString('pt-BR')} ${unidadeMin}`;
}

// CARREGAR PRODUTOS DA API
async function carregarProdutos() {
  mostrarLoading('produtosBody', 9);
  try {
    const r = await fetch('http://localhost:3000/api/produtos', {
      headers: getHeaders(),
    });
    produtos = await r.json();
    filtrar();
  } catch (err) {
    mostrarErroTabela('produtosBody', 9);
  }
}

// RENDERIZAR TABELA
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
        <td>${unidadeNome[p.unidade] || p.unidade}</td>
        <td>${p.unidade_minima}</td>
        <td>${p.fator_conversao} ${p.unidade_minima}/${p.unidade}</td>
        <td>${formatarQtd(p.qtd_atual, p.unidade_minima)}</td>
        <td>${formatarQtd(p.qtd_minima, p.unidade_minima)}</td>
        <td><span class="badge ${s.cls}">${s.label}</span></td>
        <td class="actions-cell">
          <button class="btn-edit"   onclick="abrirEdicao(${p.id})">Editar</button>
          <button class="btn-delete" onclick="excluirProduto(${p.id})">Excluir</button>
        </td>
      </tr>`;
  }).join('');
}

// FILTRAR
function filtrar() {
  const termo = document.getElementById('searchInput').value.toLowerCase();
  const cat   = document.getElementById('filterCategoria').value;
  renderTabela(produtos.filter(p =>
    p.nome.toLowerCase().includes(termo) && (cat === '' || p.categoria === cat)
  ));
}

document.getElementById('searchInput').addEventListener('input', filtrar);
document.getElementById('filterCategoria').addEventListener('change', filtrar);

// LÓGICA DE CONVERSÃO NO MODAL
// Quando o usuário muda a unidade,
// atualiza os campos automaticamente
function atualizarCamposConversao() {
  const unidade        = document.getElementById('unidade').value;
  const unidadeMinima  = document.getElementById('unidadeMinima');
  const fatorConversao = document.getElementById('fatorConversao');
  const fatorExemplo   = document.getElementById('fatorExemplo');
  const aviso          = document.getElementById('conversaoAviso');
  const avisoTexto     = document.getElementById('conversaoAvisoTexto');
  const qtdAtualHint   = document.getElementById('qtdAtualHint');
  const qtdMinimaHint  = document.getElementById('qtdMinimaHint');

  // Se for unidade simples, preenche automático e bloqueia
  if (unidade === 'un') {
    unidadeMinima.value    = 'unidade';
    unidadeMinima.disabled = true;
    fatorConversao.value   = 1;
    fatorConversao.disabled = true;
    fatorExemplo.textContent = '1 unidade = 1 unidade (sem conversão)';
    aviso.hidden = true;
    qtdAtualHint.textContent  = 'Informe a quantidade em unidades';
    qtdMinimaHint.textContent = 'Informe o mínimo em unidades';
    return;
  }

  // Libera os campos para edição
  unidadeMinima.disabled  = false;
  fatorConversao.disabled = false;

  // Sugestões automáticas por unidade
  if (unidade === 'lt') {
    unidadeMinima.placeholder  = 'mililitro';
    fatorConversao.placeholder = '1000';
    fatorExemplo.textContent   = 'Sugestão: 1 litro = 1000 mililitros';
  } else if (unidade === 'kg') {
    unidadeMinima.placeholder  = 'grama';
    fatorConversao.placeholder = '1000';
    fatorExemplo.textContent   = 'Sugestão: 1 quilo = 1000 gramas';
  } else if (unidade === 'cx') {
    unidadeMinima.placeholder  = 'unidade';
    fatorConversao.placeholder = 'Ex: 12';
    fatorExemplo.textContent   = 'Quantas unidades cabem em uma caixa?';
  } else if (unidade === 'pct') {
    unidadeMinima.placeholder  = 'unidade';
    fatorConversao.placeholder = 'Ex: 500';
    fatorExemplo.textContent   = 'Quantas unidades cabem em um pacote?';
  }

  // Atualiza aviso de conversão
  const fator      = fatorConversao.value || '?';
  const unMin      = unidadeMinima.value  || '?';
  const unPrinc    = unidadeNome[unidade] || unidade;

  aviso.hidden = false;
  avisoTexto.textContent =
    `As quantidades serão armazenadas em ${unMin}. ` +
    `Ao cadastrar "${fator} ${unPrinc}", o sistema salvará ` +
    `"${fator === '?' ? '?' : Number(fator)} ${unMin}" no estoque.`;

  qtdAtualHint.textContent  = `Informe a quantidade atual em ${unidadeNome[unidade]?.toLowerCase() || unidade}s`;
  qtdMinimaHint.textContent = `Informe o estoque mínimo em ${unidadeNome[unidade]?.toLowerCase() || unidade}s`;
}

// Atualiza aviso quando o fator ou unidade mínima muda
document.getElementById('unidade').addEventListener('change', atualizarCamposConversao);
document.getElementById('fatorConversao').addEventListener('input', atualizarCamposConversao);
document.getElementById('unidadeMinima').addEventListener('input', atualizarCamposConversao);

// MODAL
const overlay = document.getElementById('modalOverlay');

function limparForm() {
  document.getElementById('nomeProduto').value   = '';
  document.getElementById('categoria').value     = '';
  document.getElementById('unidade').value       = 'un';
  document.getElementById('unidadeMinima').value = 'unidade';
  document.getElementById('fatorConversao').value = '1';
  document.getElementById('qtdAtual').value      = '';
  document.getElementById('qtdMinima').value     = '';
  document.getElementById('descricao').value     = '';
  document.getElementById('fatorExemplo').textContent    = '1 unidade = 1 unidade (sem conversão)';
  document.getElementById('conversaoAviso').hidden       = true;
  document.getElementById('qtdAtualHint').textContent    = 'Informe a quantidade em unidades';
  document.getElementById('qtdMinimaHint').textContent   = 'Informe o mínimo em unidades';
  document.getElementById('unidadeMinima').disabled      = true;
  document.getElementById('fatorConversao').disabled     = true;
}

function fecharModal() {
  overlay.hidden = true;
  editandoId = null;
  limparForm();
}

document.getElementById('btnNovoProduto').addEventListener('click', () => {
  document.getElementById('modalTitle').textContent = 'Novo Produto';
  limparForm();
  overlay.hidden = false;
});

document.getElementById('modalClose').addEventListener('click', fecharModal);
document.getElementById('btnCancelar').addEventListener('click', fecharModal);
overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });

// SALVAR
document.getElementById('btnSalvar').addEventListener('click', async () => {
  const nome           = document.getElementById('nomeProduto').value.trim();
  const categoria      = document.getElementById('categoria').value;
  const unidade        = document.getElementById('unidade').value;
  const unidadeMinima  = document.getElementById('unidadeMinima').value.trim();
  const fatorConversao = Number(document.getElementById('fatorConversao').value);
  const qtdAtual       = Number(document.getElementById('qtdAtual').value) || 0;
  const qtdMinima      = Number(document.getElementById('qtdMinima').value) || 0;
  const descricao      = document.getElementById('descricao').value.trim();

  if (!nome || !categoria) {
    alert('Preencha o nome e a categoria.');
    return;
  }

  if (!unidadeMinima || fatorConversao < 1) {
    alert('Preencha a unidade mínima e o fator de conversão.');
    return;
  }

  // Converte as quantidades para unidade mínima antes de salvar
  const dados = {
    nome,
    categoria,
    unidade,
    unidade_minima:  unidadeMinima,
    fator_conversao: fatorConversao,
    qtd_atual:       qtdAtual  * fatorConversao,
    qtd_minima:      qtdMinima * fatorConversao,
    descricao,
  };

  try {
    const url    = editandoId
      ? `http://localhost:3000/api/produtos/${editandoId}`
      : 'http://localhost:3000/api/produtos';
    const method = editandoId ? 'PUT' : 'POST';

    await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(dados) });
    mostrarToast(editandoId ? 'Produto atualizado!' : 'Produto cadastrado!');
    fecharModal();
    await carregarProdutos();
  } catch {
    mostrarToast('Erro ao salvar produto.', 'error');
  }
});

// EDITAR
function abrirEdicao(id) {
  const p = produtos.find(p => p.id === id);
  if (!p) return;

  editandoId = id;
  document.getElementById('modalTitle').textContent  = 'Editar Produto';
  document.getElementById('nomeProduto').value        = p.nome;
  document.getElementById('categoria').value          = p.categoria;
  document.getElementById('unidade').value            = p.unidade;
  document.getElementById('unidadeMinima').value      = p.unidade_minima;
  document.getElementById('fatorConversao').value     = p.fator_conversao;

  // Mostra as quantidades convertidas de volta para a unidade principal
  document.getElementById('qtdAtual').value  = p.qtd_atual  / p.fator_conversao;
  document.getElementById('qtdMinima').value = p.qtd_minima / p.fator_conversao;
  document.getElementById('descricao').value = p.descricao || '';

  // Libera ou bloqueia campos conforme a unidade
  const ehUnidade = p.unidade === 'un';
  document.getElementById('unidadeMinima').disabled  = ehUnidade;
  document.getElementById('fatorConversao').disabled = ehUnidade;

  atualizarCamposConversao();
  overlay.hidden = false;
}

// EXCLUIR
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

// INICIALIZAÇÃO
carregarProdutos();