const db = require('../config/db');

async function listar(req, res) {
  try {
    const [rows] = await db.execute('SELECT * FROM produtos ORDER BY nome');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar produtos.' });
  }
}

async function criar(req, res) {
  const { nome, categoria, unidade, qtd_atual, qtd_minima, descricao } = req.body;
  if (!nome || !categoria) {
    return res.status(400).json({ message: 'Nome e categoria são obrigatórios.' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO produtos (nome, categoria, unidade, qtd_atual, qtd_minima, descricao) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, categoria, unidade || 'un', qtd_atual || 0, qtd_minima || 0, descricao || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Produto criado com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar produto.' });
  }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, categoria, unidade, qtd_atual, qtd_minima, descricao } = req.body;
  try {
    await db.execute(
      'UPDATE produtos SET nome=?, categoria=?, unidade=?, qtd_atual=?, qtd_minima=?, descricao=? WHERE id=?',
      [nome, categoria, unidade, qtd_atual, qtd_minima, descricao || null, id]
    );
    res.json({ message: 'Produto atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar produto.' });
  }
}

async function excluir(req, res) {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM produtos WHERE id = ?', [id]);
    res.json({ message: 'Produto excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir produto.' });
  }
}

module.exports = { listar, criar, atualizar, excluir };