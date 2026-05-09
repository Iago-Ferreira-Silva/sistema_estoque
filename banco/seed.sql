USE estoque_if;

-- SETORES
INSERT INTO setores (nome, responsavel, descricao) VALUES
  ('Secretaria',     'Maria Silva',  'Documentação e atendimento'),
  ('Coordenação',    'João Mendes',  'Gestão pedagógica'),
  ('Almoxarifado',   'Carlos Lima',  'Armazenamento geral'),
  ('Limpeza',        'Ana Souza',    'Higiene e conservação'),
  ('Administrativo', 'Pedro Costa',  'Gestão administrativa');

-- PRODUTOS
INSERT INTO produtos (nome, categoria, unidade, unidade_minima, fator_conversao, qtd_atual, qtd_minima) VALUES
  -- Papel A4: cadastrado em pacotes (pct)
  -- 1 pacote = 500 folhas
  -- 2 pct = 1000 folhas | mínimo: 10 pct = 5000 folhas
  ('Papel A4',         'escritorio', 'pct', 'folha',      500,  1000,  5000),

  -- Detergente: cadastrado em unidades (un)
  -- 1 unidade = 1 unidade (sem conversão)
  ('Detergente 500ml', 'limpeza',    'un',  'unidade',    1,    5,     8),

  -- Caneta Azul: cadastrada em caixas (cx)
  -- 1 caixa = 12 unidades
  -- 1 cx = 12 un | mínimo: 5 cx = 60 un
  ('Caneta Azul',      'escritorio', 'cx',  'unidade',    12,   12,    60),

  -- Álcool 70%: cadastrado em litros (lt)
  -- 1 litro = 1000 mililitros
  -- 20 lt = 20000 ml | mínimo: 5 lt = 5000 ml
  ('Álcool 70%',       'limpeza',    'lt',  'mililitro',  1000, 20000, 5000),

  -- Papel Toalha: cadastrado em pacotes (pct)
  -- 1 pacote = 2 rolos
  -- 15 pct = 30 rolos | mínimo: 10 pct = 20 rolos
  ('Papel Toalha',     'higiene',    'pct', 'unidade',    2,    30,    20);

-- USUÁRIOS
-- Senha de todos: admin123
INSERT INTO usuarios (nome, email, senha, perfil, setor, ativo) VALUES
  (
    'Iago Ferreira',
    'admin@ifce.edu.br',
    '$2b$10$ZF0snqAlhN63hN0XGhWEtepOSFQmTBxoOUY2llH.Ea7dY5uhhzJOS',
    'gestor',
    'Administrativo',
    1
  ),
  (
    'Maria Silva',
    'maria@ifce.edu.br',
    '$2b$10$ZF0snqAlhN63hN0XGhWEtepOSFQmTBxoOUY2llH.Ea7dY5uhhzJOS',
    'secretario',
    'Secretaria',
    1
  ),
  (
    'João Mendes',
    'joao@ifce.edu.br',
    '$2b$10$ZF0snqAlhN63hN0XGhWEtepOSFQmTBxoOUY2llH.Ea7dY5uhhzJOS',
    'coordenador',
    'Coordenação',
    1
  ),
  (
    'Carlos Lima',
    'carlos@ifce.edu.br',
    '$2b$10$ZF0snqAlhN63hN0XGhWEtepOSFQmTBxoOUY2llH.Ea7dY5uhhzJOS',
    'agente',
    'Almoxarifado',
    1
  );

-- MOVIMENTAÇÕES
INSERT INTO movimentacoes
  (produto_id, setor_id, usuario_id, tipo, quantidade, unidade_mov, quantidade_convertida, observacao)
VALUES
  -- Álcool 70%: entrada de 10 litros = 10000 ml
  (4, 3, 1, 'entrada', 10,   'litro',   10000, 'Reposição mensal'),

  -- Papel A4: saída de 3 pacotes = 1500 folhas
  (1, 1, 2, 'saida',   3,    'pacote',  1500,  NULL),

  -- Caneta Azul: saída de 5 caixas = 60 unidades
  (3, 2, 3, 'saida',   5,    'caixa',   60,    'Uso em reunião'),

  -- Detergente: entrada de 6 unidades = 6 unidades
  (2, 3, 4, 'entrada', 6,    'unidade', 6,     NULL),

  -- Papel Toalha: saída de 2 pacotes = 4 rolos
  (5, 4, 4, 'saida',   2,    'pacote',  4,     NULL);

-- SOLICITAÇÕES
INSERT INTO solicitacoes (produto_id, setor_id, usuario_id, quantidade, justificativa, status) VALUES
  (1, 1, 2, 5,  'Reposição urgente',    'pendente'),
  (4, 4, 4, 10, NULL,                   'pendente'),
  (3, 2, 3, 20, 'Uso em reunião',       'aprovada'),
  (2, 3, 4, 6,  NULL,                   'aprovada'),
  (5, 5, 1, 4,  'Estoque insuficiente', 'recusada');