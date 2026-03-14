CREATE TABLE if NOT EXISTS `usuario` (
  `id_usuario` INT(6) NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `data_nascimento` DATE NOT NULL,
  `cpf` VARCHAR(11) UNIQUE NOT NULL,
  `cargo` VARCHAR(30) NOT NULL,
  `matricula` INT(10) UNIQUE NOT NULL,
  `email` VARCHAR(50) UNIQUE NOT NULL,
  `senha` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE if NOT EXISTS `produto` (
  `id_produto` INT(6) NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(20) NOT NULL,
  `validade` DATE NOT NULL,
  `categoria` VARCHAR(20) NOT NULL,
  `quantidade_atual` INT(10) NOT NULL,
  `prazo_repor`INT(10) NOT NULL, 
  PRIMARY KEY (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE if NOT EXISTS `setor` (
  `id_setor` INT(6) NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id_setor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;