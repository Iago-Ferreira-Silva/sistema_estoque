inicializarPagina();

const unidadeNome = {
  un:  'Unidade',
  cx:  'Caixa',
  pct: 'Pacote',
  lt:  'Litro',
  kg:  'Quilo',
};

// CARREGAR DADOS DA API
async function carregarDashboard() {
  try {
    const [resProd, resMov, resSol] = await Promise.all([
      fetch('http://localhost:3000/api/produtos',      { headers: getHeaders() }),
      fetch('http://localhost:3000/api/movimentacoes', { headers: getHeaders() }),
      fetch('http://localhost:3000/api/solicitacoes',  { headers: getHeaders() }),
    ]);

    const produtos      = await resProd.json();
    const movimentacoes = await resMov.json();
    const solicitacoes  = await resSol.json();

    // KPIs
    const criticos  = produtos.filter(p =>
      Number(p.qtd_atual) <= Number(p.qtd_minima)
    ).length;

    const pendentes = solicitacoes.filter(s => s.status === 'pendente').length;

    const hoje    = new Date().toLocaleDateString('pt-BR');
    const movHoje = movimentacoes.filter(m =>
      new Date(m.criado_em).toLocaleDateString('pt-BR') === hoje
    ).length;

    document.getElementById('totalProdutos').textContent         = produtos.length;
    document.getElementById('estoqueCritico').textContent        = criticos;
    document.getElementById('solicitacoesPendentes').textContent = pendentes;
    document.getElementById('movimentacoesHoje').textContent     = movHoje;

    // ALERTAS DE ESTOQUE
    const alertList    = document.getElementById('alertList');
    const criticosList = produtos.filter(p =>
      Number(p.qtd_atual) <= Number(p.qtd_minima)
    );

    if (criticosList.length === 0) {
      alertList.innerHTML = `
        <li style="color: var(--color-text-muted); font-size: 0.875rem; padding: 8px 0;">
          ✅ Nenhum alerta no momento.
        </li>`;
    } else {
      alertList.innerHTML = criticosList.map(p => {
        // Converte para unidade principal
        const qtdPrincipal = Number(p.qtd_atual) / Number(p.fator_conversao);
        const unidPrinc    = unidadeNome[p.unidade] || p.unidade;
        const isCritico    = Number(p.qtd_atual) === 0;

        return `
          <li class="alert-item">
            <div class="alert-nome-wrapper">
              <span class="alert-name">${p.nome}</span>
              <small style="color: var(--color-text-muted); font-size: 0.75rem;">
                ${Number(p.qtd_atual).toLocaleString('pt-BR')} ${p.unidade_minima}
              </small>
            </div>
            <span class="alert-stock ${isCritico ? 'danger' : 'warning'}">
              ${qtdPrincipal.toLocaleString('pt-BR')} ${unidPrinc}
            </span>
          </li>`;
      }).join('');
    }

    // MOVIMENTAÇÕES RECENTES
    const tbody = document.querySelector('#movTable tbody');

    if (movimentacoes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; color: var(--color-text-muted); padding: 24px;">
            Nenhuma movimentação registrada.
          </td>
        </tr>`;
    } else {
      tbody.innerHTML = movimentacoes.slice(0, 5).map(m => `
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
          <td>${formatarData(m.criado_em)}</td>
        </tr>
      `).join('');
    }

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

carregarDashboard();