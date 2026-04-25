const db = require('../config/db');

async function listar(req, res) {
  try {
    const [rows] = await db.execute(`
      SELECT
        s.id, s.quantidade, s.justificativa, s.status, s.criado_em,
        p.nome AS produto,
        st.nome AS setor,
        u.nome AS solicitante
      FROM solicitacoes s
      JOIN produtos  p  ON s.produto_id = p.id
      JOIN setores   st ON s.setor_id   = st.id
      JOIN usuarios  u  ON s.usuario_id = u.id
      ORDER BY s.criado_em DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar solicitações.' });
  }
}

async function criar(req, res) {
  const { produto_id, setor_id, quantidade, justificativa } = req.body;
  const usuario_id = req.usuario.id;

  if (!produto_id || !setor_id || !quantidade) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO solicitacoes (produto_id, setor_id, usuario_id, quantidade, justificativa) VALUES (?, ?, ?, ?, ?)',
      [produto_id, setor_id, usuario_id, quantidade, justificativa || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Solicitação criada com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar solicitação.' });
  }
}

async function atualizarStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!['aprovada', 'recusada'].includes(status)) {
    return res.status(400).json({ message: 'Status inválido.' });
  }

  try {
    await db.execute('UPDATE solicitacoes SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Solicitação ${status} com sucesso.` });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar status.' });
  }
}

module.exports = { listar, criar, atualizarStatus };