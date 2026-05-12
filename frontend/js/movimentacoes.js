inicializarPagina();

// ESTADO
let movimentacoes     = [];
let produtos          = [];
let setores           = [];
let produtoSelecionado = null;

const unidadeNome = {
  un:  'Unidade',
  cx:  'Caixa',
  pct: 'Pacote',
  lt:  'Litro',
  kg:  'Quilo',
};

const hoje = new Date().toLocaleDateString('pt-BR');

// CARREGAR DADOS DA API
async function carregarDados() {
  try {
    const [resMov, resProd, resSeto] = await Promise.all([
      fetch('http://localhost:3000/api/movimentacoes', { headers: getHeaders() }),
      fetch('http://localhost:3000/api/produtos',      { headers: getHeaders() }),
      fetch('http://localhost:3000/api/setores',       { headers: getHeaders() }),
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
  selectProduto.innerHTML = '<option value="">Selecione um produto...</option>' +
    produtos.map(p =>
      `<option value="${p.id}">${p.nome} (${unidadeNome[p.unidade] || p.unidade})</option>`
    ).join('');

  const selectSetor = document.getElementById('setorMov');
  selectSetor.innerHTML = '<option value="">Selecione...</option>' +
    setores.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
}

// QUANDO O USUÁRIO SELECIONA UM PRODUTO
document.getElementById('produtoMov').addEventListener('change', function () {
  const id = Number(this.value);
  produtoSelecionado = produtos.find(p => p.id === id) || null;

  const infoCard      = document.getElementById('produtoInfoCard');
  const qtdInput      = document.getElementById('quantidade');
  const unidadeSelect = document.getElementById('unidadeMov');
  const preview       = document.getElementById('conversaoPreview');

  if (!produtoSelecionado) {
    infoCard.hidden       = true;
    qtdInput.disabled     = true;
    unidadeSelect.disabled = true;
    preview.hidden        = true;
    qtdInput.value        = '';
    return;
  }

  const p = produtoSelecionado;

  infoCard.hidden = false;
  document.getElementById('infoPrincipal').textContent =
    unidadeNome[p.unidade] || p.unidade;
  document.getElementById('infoMinima').textContent =
    p.unidade_minima;
  document.getElementById('infoFator').textContent =
    `1 ${unidadeNome[p.unidade] || p.unidade} = ${p.fator_conversao} ${p.unidade_minima}`;
  document.getElementById('infoEstoque').textContent =
    `${Number(p.qtd_atual).toLocaleString('pt-BR')} ${p.unidade_minima}`;

  qtdInput.disabled      = false;
  qtdInput.value         = '';
  unidadeSelect.disabled = false;

  unidadeSelect.innerHTML = `
    <option value="${p.unidade}" data-fator="${p.fator_conversao}">
      ${unidadeNome[p.unidade] || p.unidade} (unidade principal)
    </option>
    <option value="${p.unidade_minima}" data-fator="1">
      ${p.unidade_minima} (unidade mínima)
    </option>
  `;

  preview.hidden = true;
  atualizarPreviewConversao();
});

// PREVIEW DA CONVERSÃO EM TEMPO REAL
function atualizarPreviewConversao() {
  if (!produtoSelecionado) return;

  const quantidade       = Number(document.getElementById('quantidade').value);
  const unidadeSelect    = document.getElementById('unidadeMov');
  const unidadeEscolhida = unidadeSelect.value;
  const fatorOpcao       = Number(unidadeSelect.selectedOptions[0]?.dataset.fator || 1);
  const preview          = document.getElementById('conversaoPreview');
  const textoPreview     = document.getElementById('conversaoTexto');

  if (!quantidade || quantidade <= 0) {
    preview.hidden = true;
    return;
  }

  const quantidadeConvertida = quantidade * fatorOpcao;
  const p = produtoSelecionado;

  preview.hidden = false;

  if (fatorOpcao === 1) {
    textoPreview.textContent =
      `${quantidade} ${unidadeEscolhida} serão registrados diretamente no estoque.`;
  } else {
    textoPreview.textContent =
      `${quantidade} ${unidadeNome[unidadeEscolhida] || unidadeEscolhida} = ` +
      `${quantidadeConvertida.toLocaleString('pt-BR')} ${p.unidade_minima} ` +
      `que serão atualizados no estoque.`;
  }
}

document.getElementById('quantidade').addEventListener('input', atualizarPreviewConversao);
document.getElementById('unidadeMov').addEventListener('change', atualizarPreviewConversao);

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
      <td>${Number(m.quantidade).toLocaleString('pt-BR')} ${m.unidade_mov}</td>
      <td>${Number(m.quantidade_convertida).toLocaleString('pt-BR')} ${m.unidade_minima || ''}</td>
      <td>${m.setor}</td>
      <td>${m.responsavel || '—'}</td>
      <td>${m.observacao || '—'}</td>
      <td>${formatarData(m.criado_em)}</td>
    </tr>
  `).join('');
}

// FILTRAR
function filtrar() {
  const termo = document.getElementById('searchInput').value.toLowerCase();
  const tipo  = document.getElementById('filterTipo').value;
  const data  = document.getElementById('filterData').value;

  const lista = movimentacoes.filter(m => {
    const textoOk = m.produto.toLowerCase().includes(termo) ||
                    m.setor.toLowerCase().includes(termo);
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

function limparModal() {
  document.getElementById('produtoMov').value     = '';
  document.getElementById('quantidade').value     = '';
  document.getElementById('responsavelMov').value = '';
  document.getElementById('setorMov').value       = '';
  document.getElementById('observacao').value     = '';
  document.getElementById('tipoMov').value        = 'entrada';
  document.getElementById('produtoInfoCard').hidden   = true;
  document.getElementById('conversaoPreview').hidden  = true;
  document.getElementById('quantidade').disabled      = true;
  document.getElementById('unidadeMov').disabled      = true;
  document.getElementById('unidadeMov').innerHTML     =
    '<option value="">Selecione o produto primeiro</option>';
  document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btnEntrada').classList.add('active');
  produtoSelecionado = null;
}

function fecharModal() {
  overlay.hidden = true;
  limparModal();
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

// SALVAR MOVIMENTAÇÃO
document.getElementById('btnSalvar').addEventListener('click', async () => {
  if (!produtoSelecionado) {
    alert('Selecione um produto.');
    return;
  }

  const tipo            = document.getElementById('tipoMov').value;
  const quantidade      = Number(document.getElementById('quantidade').value);
  const setorId         = Number(document.getElementById('setorMov').value);
  const responsavel     = document.getElementById('responsavelMov').value.trim();
  const observacao      = document.getElementById('observacao').value.trim();
  const unidadeSelect   = document.getElementById('unidadeMov');
  const unidadeMov      = unidadeSelect.value;
  const fatorOpcao      = Number(unidadeSelect.selectedOptions[0]?.dataset.fator || 1);

  if (!setorId || quantidade <= 0 || !responsavel) {
    alert('Preencha o setor, a quantidade e o responsável.');
    return;
  }

  const quantidadeConvertida = quantidade * fatorOpcao;

  if (tipo === 'saida' && quantidadeConvertida > Number(produtoSelecionado.qtd_atual)) {
    alert(
      `Estoque insuficiente!\n` +
      `Disponível: ${Number(produtoSelecionado.qtd_atual).toLocaleString('pt-BR')} ` +
      `${produtoSelecionado.unidade_minima}\n` +
      `Solicitado: ${quantidadeConvertida.toLocaleString('pt-BR')} ` +
      `${produtoSelecionado.unidade_minima}`
    );
    return;
  }

  const dados = {
    produto_id:            produtoSelecionado.id,
    setor_id:              setorId,
    tipo,
    quantidade,
    unidade_mov:           unidadeMov,
    quantidade_convertida: quantidadeConvertida,
    responsavel_nome:      responsavel,
    observacao,
  };

  try {
    await fetch('http://localhost:3000/api/movimentacoes', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dados),
    });

    mostrarToast('Movimentação registrada com sucesso!');
    fecharModal();
    await carregarDados();
  } catch (err) {
    mostrarToast('Erro ao registrar movimentação.', 'error');
  }
});

// INICIALIZAÇÃO
carregarDados();