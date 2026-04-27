// Inicializa sidebar, topbar, logout e avatar
inicializarPagina();

// CARREGAR DADOS DA API
async function carregarDashboard() {
  const headers = getHeaders();

  // Mostra skeletons enquanto carrega
  mostrarLoading('alertList', 2);

  try {
    // Busca os 3 recursos ao mesmo tempo (mais rápido)
    const [resProd, resMov, resSol] = await Promise.all([
      fetch('http://localhost:3000/api/produtos',      { headers }),
      fetch('http://localhost:3000/api/movimentacoes', { headers }),
      fetch('http://localhost:3000/api/solicitacoes',  { headers }),
    ]);

    const produtos       = await resProd.json();
    const movimentacoes  = await resMov.json();
    const solicitacoes   = await resSol.json();

    // KPIs
    const criticos  = produtos.filter(p => p.qtd_atual <= p.qtd_minima).length;
    const pendentes = solicitacoes.filter(s => s.status === 'pendente').length;
    const hoje      = new Date().toLocaleDateString('pt-BR');
    const movHoje   = movimentacoes.filter(m =>
      new Date(m.criado_em).toLocaleDateString('pt-BR') === hoje
    ).length;

    document.getElementById('totalProdutos').textContent        = produtos.length;
    document.getElementById('estoqueCritico').textContent       = criticos;
    document.getElementById('solicitacoesPendentes').textContent = pendentes;
    document.getElementById('movimentacoesHoje').textContent    = movHoje;

    // Alertas de estoque
    const alertList   = document.getElementById('alertList');
    const criticosList = produtos.filter(p => p.qtd_atual <= p.qtd_minima);

    if (criticosList.length === 0) {
      alertList.innerHTML = `
        <li style="color: var(--color-text-muted); font-size: 0.875rem; padding: 8px 0;">
          ✅ Nenhum alerta no momento.
        </li>`;
    } else {
      alertList.innerHTML = criticosList.map(p => `
        <li class="alert-item">
          <span class="alert-name">${p.nome}</span>
          <span class="alert-stock ${p.qtd_atual === 0 ? 'danger' : 'warning'}">
            ${p.qtd_atual} ${p.unidade}.
          </span>
        </li>
      `).join('');
    }

    //Movimentações recentes 
    const tbody = document.querySelector('#movTable tbody');
    if (movimentacoes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; color: var(--color-text-muted); padding: 24px;">
            Nenhuma movimentação registrada.
          </td>
        </tr>`;
    } else {
      tbody.innerHTML = movimentacoes.slice(0, 5).map(m => `
        <tr>
          <td>${m.produto}</td>
          <td>
            <span class="badge ${m.tipo === 'entrada' ? 'badge-in' : 'badge-out'}">
              ${m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
            </span>
          </td>
          <td>${m.quantidade}</td>
          <td>${m.setor}</td>
          <td>${formatarData(m.criado_em)}</td>
        </tr>
      `).join('');
    }

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

carregarDashboard();