const db = require('../config/db');

async function listar(req, res) {
  try {
    const [rows] = await db.execute('SELECT * FROM setores ORDER BY nome');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar setores.' });
  }
}

async function criar(req, res) {
  const { nome, responsavel, descricao } = req.body;
  if (!nome) {
    return res.status(400).json({ message: 'Nome do setor é obrigatório.' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO setores (nome, responsavel, descricao) VALUES (?, ?, ?)',
      [nome, responsavel || null, descricao || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Setor criado com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar setor.' });
  }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, responsavel, descricao } = req.body;
  try {
    await db.execute(
      'UPDATE setores SET nome=?, responsavel=?, descricao=? WHERE id=?',
      [nome, responsavel || null, descricao || null, id]
    );
    res.json({ message: 'Setor atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar setor.' });
  }
}

async function excluir(req, res) {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM setores WHERE id = ?', [id]);
    res.json({ message: 'Setor excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir setor.' });
  }
}

module.exports = { listar, criar, atualizar, excluir };