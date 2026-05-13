inicializarPagina();

// ESTADO
let solicitacoes = [];
let produtos     = [];
let setores      = [];
let statusAtivo  = 'todas';

const unidadeNome = {
  un:  'Unidade',
  cx:  'Caixa',
  pct: 'Pacote',
  lt:  'Litro',
  kg:  'Quilo',
};

// CARREGAR DADOS DA API
async function carregarDados() {
  try {
    const [resSol, resProd, resSeto] = await Promise.all([
      fetch('http://localhost:3000/api/solicitacoes', { headers: getHeaders() }),
      fetch('http://localhost:3000/api/produtos',     { headers: getHeaders() }),
      fetch('http://localhost:3000/api/setores',      { headers: getHeaders() }),
    ]);

    solicitacoes = await resSol.json();
    produtos     = await resProd.json();
    setores      = await resSeto.json();

    popularSelects();
    atualizarContagem();
    renderTabela();
  } catch (err) {
    console.error('Erro ao carregar solicitações:', err);
  }
}

// POPULAR SELECTS
function popularSelects() {
  // Produtos
  const selectProduto = document.getElementById('produtoSol');
  selectProduto.innerHTML = '<option value="">Selecione um produto...</option>' +
    produtos.map(p =>
      `<option value="${p.id}"
        data-unidade="${p.unidade}"
        data-unidade-minima="${p.unidade_minima}"
        data-fator="${p.fator_conversao}"
        data-estoque="${p.qtd_atual}">
        ${p.nome} (${unidadeNome[p.unidade] || p.unidade})
      </option>`
    ).join('');

  // Setores
  const selectSetor = document.getElementById('setorSol');
  selectSetor.innerHTML = '<option value="">Selecione...</option>' +
    setores.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
}

// QUANDO SELECIONA UM PRODUTO
document.getElementById('produtoSol').addEventListener('change', function () {
  const option       = this.selectedOptions[0];
  const infoCard     = document.getElementById('produtoInfoSol');
  const infoTexto    = document.getElementById('produtoInfoSolTexto');
  const qtdInput     = document.getElementById('qtdSol');
  const qtdHint      = document.getElementById('qtdSolHint');

  if (!this.value) {
    infoCard.hidden   = true;
    qtdInput.disabled = true;
    qtdInput.value    = '';
    qtdHint.textContent = '';
    return;
  }

  const unidade      = option.dataset.unidade;
  const unidadeMin   = option.dataset.unidadeMinima;
  const fator        = Number(option.dataset.fator);
  const estoque      = Number(option.dataset.estoque);
  const unidPrinc    = unidadeNome[unidade] || unidade;
  const estoquePrinc = (estoque / fator).toLocaleString('pt-BR');

  infoCard.hidden = false;
  infoTexto.textContent =
    `Unidade: ${unidPrinc} | ` +
    `Estoque disponível: ${estoquePrinc} ${unidPrinc} ` +
    `(${estoque.toLocaleString('pt-BR')} ${unidadeMin})`;

  qtdInput.disabled = false;
  qtdHint.textContent = `Informe a quantidade em ${unidPrinc.toLowerCase()}s`;
});

// CONTAGEM DE PENDENTES
function atualizarContagem() {
  const count = solicitacoes.filter(s => s.status === 'pendente').length;
  document.getElementById('countPendente').textContent = count;
}

// RENDERIZAR TABELA
function renderTabela() {
  const termo  = document.getElementById('searchInput').value.toLowerCase();
  const tbody  = document.getElementById('solBody');
  const empty  = document.getElementById('tableEmpty');

  const lista = solicitacoes.filter(s => {
    const textoOk  = s.produto.toLowerCase().includes(termo) ||
                     s.setor.toLowerCase().includes(termo);
    const statusOk = statusAtivo === 'todas' || s.status === statusAtivo;
    return textoOk && statusOk;
  });

  if (lista.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  const badgeMap = {
    pendente: 'badge-pendente',
    aprovada: 'badge-aprovada',
    recusada: 'badge-recusada',
  };

  const labelMap = {
    pendente: 'Pendente',
    aprovada: 'Aprovada',
    recusada: 'Recusada',
  };

  tbody.innerHTML = lista.map(s => {
    // Busca o produto para mostrar a unidade
    const produto    = produtos.find(p => p.id === s.produto_id);
    const unidPrinc  = produto
      ? (unidadeNome[produto.unidade] || produto.unidade)
      : '';

    const acoes = s.status === 'pendente'
      ? `<button class="btn-aprovar" onclick="mudarStatus(${s.id}, 'aprovada')">Aprovar</button>
         <button class="btn-recusar" onclick="mudarStatus(${s.id}, 'recusada')">Recusar</button>`
      : `<span style="color: var(--color-text-light); font-size: 0.8rem;">—</span>`;

    return `
      <tr>
        <td><strong>${s.produto}</strong></td>
        <td>${Number(s.quantidade).toLocaleString('pt-BR')} ${unidPrinc}</td>
        <td>${s.setor}</td>
        <td>${s.solicitante}</td>
        <td>${s.justificativa || '—'}</td>
        <td>${formatarData(s.criado_em)}</td>
        <td><span class="badge ${badgeMap[s.status]}">${labelMap[s.status]}</span></td>
        <td class="actions-cell">${acoes}</td>
      </tr>`;
  }).join('');
}

// MUDAR STATUS
async function mudarStatus(id, novoStatus) {
  try {
    await fetch(`http://localhost:3000/api/solicitacoes/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status: novoStatus }),
    });
    mostrarToast(`Solicitação ${novoStatus === 'aprovada' ? 'aprovada' : 'recusada'}!`);
    await carregarDados();
  } catch (err) {
    mostrarToast('Erro ao atualizar status.', 'error');
  }
}

// ABAS
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    statusAtivo = btn.dataset.status;
    renderTabela();
  });
});

document.getElementById('searchInput').addEventListener('input', renderTabela);

// MODAL
const overlay = document.getElementById('modalOverlay');

function fecharModal() {
  overlay.hidden = true;
  document.getElementById('produtoSol').value    = '';
  document.getElementById('qtdSol').value        = '';
  document.getElementById('setorSol').value      = '';
  document.getElementById('solicitante').value   = '';
  document.getElementById('justificativa').value = '';
  document.getElementById('produtoInfoSol').hidden = true;
  document.getElementById('qtdSol').disabled       = true;
  document.getElementById('qtdSolHint').textContent = '';
}

document.getElementById('btnNovaSolicitacao').addEventListener('click', () => {
  overlay.hidden = false;
});
document.getElementById('modalClose').addEventListener('click', fecharModal);
document.getElementById('btnCancelar').addEventListener('click', fecharModal);
overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });

// SALVAR
document.getElementById('btnSalvar').addEventListener('click', async () => {
  const produtoId   = Number(document.getElementById('produtoSol').value);
  const quantidade  = Number(document.getElementById('qtdSol').value);
  const setorId     = Number(document.getElementById('setorSol').value);
  const solicitante = document.getElementById('solicitante').value.trim();
  const justificativa = document.getElementById('justificativa').value.trim();

  if (!produtoId || !setorId || !solicitante || quantidade < 1) {
    alert('Preencha produto, setor, solicitante e quantidade.');
    return;
  }

  const dados = {
    produto_id:   produtoId,
    setor_id:     setorId,
    quantidade,
    justificativa,
  };

  try {
    await fetch('http://localhost:3000/api/solicitacoes', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dados),
    });
    mostrarToast('Solicitação enviada com sucesso!');
    fecharModal();
    await carregarDados();
  } catch (err) {
    mostrarToast('Erro ao enviar solicitação.', 'error');
  }
});

// INICIALIZAÇÃO
carregarDados();