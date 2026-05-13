inicializarPagina();

// ESTADO
let todasMovimentacoes = [];
let setores            = [];

// CARREGAR DADOS DA API
async function carregarDados() {
  try {
    const [resMov, resSeto] = await Promise.all([
      fetch('http://localhost:3000/api/movimentacoes', { headers: getHeaders() }),
      fetch('http://localhost:3000/api/setores',       { headers: getHeaders() }),
    ]);

    todasMovimentacoes = await resMov.json();
    setores            = await resSeto.json();

    popularFiltroSetor();
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
  }
}

// POPULAR FILTRO DE SETOR
function popularFiltroSetor() {
  const select = document.getElementById('filterSetor');
  select.innerHTML = '<option value="">Todos</option>' +
    setores.map(s => `<option value="${s.nome}">${s.nome}</option>`).join('');
}

// GERAR RELATÓRIO
function gerarRelatorio() {
  const tipo       = document.getElementById('filterTipo').value;
  const setor      = document.getElementById('filterSetor').value;
  const dataInicio = document.getElementById('filterDataInicio').value;
  const dataFim    = document.getElementById('filterDataFim').value;

  let lista = todasMovimentacoes.filter(m => {
    const tipoOk  = tipo  === '' || m.tipo  === tipo;
    const setorOk = setor === '' || m.setor === setor;
    const dataItem = new Date(m.criado_em);
    const inicioOk = dataInicio === '' || dataItem >= new Date(dataInicio + 'T00:00:00');
    const fimOk    = dataFim    === '' || dataItem <= new Date(dataFim    + 'T23:59:59');
    return tipoOk && setorOk && inicioOk && fimOk;
  });

  // Exibe seção de resultados
  document.getElementById('resultadosSection').hidden = false;

  // KPIs
  const entradas = lista.filter(m => m.tipo === 'entrada').length;
  const saidas   = lista.filter(m => m.tipo === 'saida').length;
  const itens    = lista.reduce((acc, m) => acc + Number(m.quantidade_convertida), 0);

  document.getElementById('relTotal').textContent    = lista.length;
  document.getElementById('relEntradas').textContent = entradas;
  document.getElementById('relSaidas').textContent   = saidas;
  document.getElementById('relItens').textContent    = itens.toLocaleString('pt-BR');

  // Tabela
  const tbody = document.getElementById('relBody');
  const empty = document.getElementById('tableEmpty');

  if (lista.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    window._relatorioAtual = [];
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

  window._relatorioAtual = lista;
}

// EXPORTAR CSV
document.getElementById('btnExport').addEventListener('click', () => {
  const lista = window._relatorioAtual;
  if (!lista || lista.length === 0) return;

  const cabecalho = [
    'Produto',
    'Tipo',
    'Quantidade',
    'Unidade Movimentação',
    'Qtd. Convertida',
    'Unidade Mínima',
    'Setor',
    'Responsável',
    'Observação',
    'Data',
  ];

  const linhas = lista.map(m => [
    m.produto,
    m.tipo,
    Number(m.quantidade).toLocaleString('pt-BR'),
    m.unidade_mov,
    Number(m.quantidade_convertida).toLocaleString('pt-BR'),
    m.unidade_minima || '',
    m.setor,
    m.responsavel || '',
    m.observacao  || '',
    formatarData(m.criado_em),
  ].join(';'));

  const csv  = [cabecalho.join(';'), ...linhas].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `relatorio_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

// LIMPAR FILTROS
document.getElementById('btnLimpar').addEventListener('click', () => {
  document.getElementById('filterTipo').value       = '';
  document.getElementById('filterSetor').value      = '';
  document.getElementById('filterDataInicio').value = '';
  document.getElementById('filterDataFim').value    = '';
  document.getElementById('resultadosSection').hidden = true;
});

// EVENTOS
document.getElementById('btnGerar').addEventListener('click', gerarRelatorio);

// INICIALIZAÇÃO
carregarDados();