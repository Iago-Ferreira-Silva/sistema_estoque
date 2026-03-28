CREATE DATABASE IF NOT EXISTS controleestoque;
USE controleestoque;

-- =========================
-- TABELA USUARIO
-- =========================
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  data_nascimento DATE NOT NULL,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  cargo VARCHAR(30) NOT NULL,
  matricula INT UNIQUE NOT NULL,
  email VARCHAR(50) UNIQUE NOT NULL,
  senha VARCHAR(10) NOT NULL,
  PRIMARY KEY (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- TABELA PRODUTO
-- =========================
CREATE TABLE IF NOT EXISTS produto (
  id_produto INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(20) NOT NULL,
  validade DATE NOT NULL,
  categoria VARCHAR(20) NOT NULL,
  quantidade_atual INT NOT NULL,
  prazo_repor INT NOT NULL,
  PRIMARY KEY (id_produto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- TABELA SETOR
-- =========================
CREATE TABLE IF NOT EXISTS setor (
  id_setor INT NOT NULL AUTO_INCREMENT,
  nome_setor VARCHAR(20) NOT NULL,
  nome_funcionario VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_setor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- TABELA ENTRADA PRODUTO (CORRIGIDA)
-- =========================
CREATE TABLE IF NOT EXISTS entrada_produto (
  id_entrada INT NOT NULL AUTO_INCREMENT,
  id_produto INT NOT NULL,
  id_usuario INT NOT NULL,
  quantidade INT NOT NULL,
  data_entrada DATETIME NOT NULL,
  PRIMARY KEY (id_entrada),
  FOREIGN KEY (id_produto) REFERENCES produto(id_produto) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- TABELA SAIDA PRODUTO
-- =========================
CREATE TABLE IF NOT EXISTS saida_produto (
  id_saida INT NOT NULL AUTO_INCREMENT,
  id_produto INT NOT NULL,
  id_usuario INT NOT NULL,
  id_setor INT NOT NULL,
  quantidade_retirada INT NOT NULL,
  data_saida DATETIME NOT NULL,
  PRIMARY KEY (id_saida),
  FOREIGN KEY (id_produto) REFERENCES produto(id_produto) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_setor) REFERENCES setor(id_setor) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- TABELA RELATORIO
-- =========================
CREATE TABLE IF NOT EXISTS relatorio (
  id_relatorio INT NOT NULL AUTO_INCREMENT,
  id_produto INT NOT NULL,
  id_usuario INT NOT NULL,
  tipo ENUM('entrada', 'saida') NOT NULL,
  periodo_inicio DATETIME NOT NULL,
  periodo_fim DATETIME NOT NULL,
  PRIMARY KEY (id_relatorio),
  FOREIGN KEY (id_produto) REFERENCES produto(id_produto) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;