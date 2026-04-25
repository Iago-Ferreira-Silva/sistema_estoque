const bcrypt = require('bcrypt');
const db     = require('../config/db');

async function listar(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT id, nome, email, perfil, setor, ativo, criado_em FROM usuarios ORDER BY nome'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar usuários.' });
  }
}

async function criar(req, res) {
  const { nome, email, senha, perfil, setor } = req.body;
  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
  }
  try {
    const hash = await bcrypt.hash(senha, 10);
    const [result] = await db.execute(
      'INSERT INTO usuarios (nome, email, senha, perfil, setor) VALUES (?, ?, ?, ?, ?)',
      [nome, email, hash, perfil, setor || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Usuário criado com sucesso.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'E-mail já cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao criar usuário.' });
  }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, email, perfil, setor, senha } = req.body;

  try {
    if (senha && senha.length >= 8) {
      const hash = await bcrypt.hash(senha, 10);
      await db.execute(
        'UPDATE usuarios SET nome=?, email=?, perfil=?, setor=?, senha=? WHERE id=?',
        [nome, email, perfil, setor || null, hash, id]
      );
    } else {
      await db.execute(
        'UPDATE usuarios SET nome=?, email=?, perfil=?, setor=? WHERE id=?',
        [nome, email, perfil, setor || null, id]
      );
    }

    res.json({ message: 'Usuário atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar usuário.' });
  }
}

async function toggleStatus(req, res) {
  const { id } = req.params;
  try {
    await db.execute(
      'UPDATE usuarios SET ativo = NOT ativo WHERE id = ?',
      [id]
    );
    res.json({ message: 'Status do usuário atualizado.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar status.' });
  }
}

module.exports = { listar, criar, atualizar, toggleStatus };