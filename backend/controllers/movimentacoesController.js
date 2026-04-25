const db = require('../config/db');

async function listar(req, res) {
  try {
    const [rows] = await db.execute(`
      SELECT
        m.id, m.tipo, m.quantidade, m.observacao, m.criado_em,
        p.nome AS produto,
        s.nome AS setor,
        u.nome AS responsavel
      FROM movimentacoes m
      JOIN produtos  p ON m.produto_id  = p.id
      JOIN setores   s ON m.setor_id    = s.id
      JOIN usuarios  u ON m.usuario_id  = u.id
      ORDER BY m.criado_em DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar movimentações.' });
  }
}

async function criar(req, res) {
  const { produto_id, setor_id, tipo, quantidade, observacao } = req.body;
  const usuario_id = req.usuario.id;

  if (!produto_id || !setor_id || !tipo || !quantidade) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO movimentacoes (produto_id, setor_id, usuario_id, tipo, quantidade, observacao) VALUES (?, ?, ?, ?, ?, ?)',
      [produto_id, setor_id, usuario_id, tipo, quantidade, observacao || null]
    );

    // Atualiza o estoque do produto
    const operacao = tipo === 'entrada' ? '+' : '-';
    await db.execute(
      `UPDATE produtos SET qtd_atual = qtd_atual ${operacao} ? WHERE id = ?`,
      [quantidade, produto_id]
    );

    res.status(201).json({ id: result.insertId, message: 'Movimentação registrada com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar movimentação.' });
  }
}

module.exports = { listar, criar };