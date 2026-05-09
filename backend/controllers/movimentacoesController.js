const db = require('../config/db');

async function listar(req, res) {
  try {
    const [rows] = await db.execute(`
      SELECT
        m.id,
        m.tipo,
        m.quantidade,
        m.unidade_mov,
        m.quantidade_convertida,
        m.observacao,
        m.criado_em,
        p.nome          AS produto,
        p.unidade_minima,
        s.nome          AS setor,
        u.nome          AS responsavel
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
  const {
    produto_id,
    setor_id,
    tipo,
    quantidade,
    unidade_mov,
    quantidade_convertida,
    observacao,
  } = req.body;

  const usuario_id = req.usuario.id;

  if (!produto_id || !setor_id || !tipo || !quantidade || !unidade_mov) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Salva a movimentação
    await connection.execute(
      `INSERT INTO movimentacoes
        (produto_id, setor_id, usuario_id, tipo, quantidade,
         unidade_mov, quantidade_convertida, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [produto_id, setor_id, usuario_id, tipo, quantidade,
       unidade_mov, quantidade_convertida, observacao || null]
    );

    // Atualiza o estoque usando a quantidade já convertida
    const operacao = tipo === 'entrada' ? '+' : '-';
    await connection.execute(
      `UPDATE produtos
       SET qtd_atual = qtd_atual ${operacao} ?
       WHERE id = ?`,
      [quantidade_convertida, produto_id]
    );

    await connection.commit();
    res.status(201).json({ message: 'Movimentação registrada com sucesso.' });

  } catch (err) {
    await connection.rollback();
    console.error('Erro ao registrar movimentação:', err);
    res.status(500).json({ message: 'Erro ao registrar movimentação.' });
  } finally {
    connection.release();
  }
}

module.exports = { listar, criar };