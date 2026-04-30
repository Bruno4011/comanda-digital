-- COMANDA DIGITAL — Schema PostgreSQL para Render
DROP TABLE IF EXISTS itens_comanda CASCADE;
DROP TABLE IF EXISTS comandas      CASCADE;
DROP TABLE IF EXISTS mesas         CASCADE;
DROP TABLE IF EXISTS produtos      CASCADE;
DROP TABLE IF EXISTS categorias    CASCADE;
DROP TABLE IF EXISTS usuarios      CASCADE;

CREATE TABLE usuarios (
    id        BIGSERIAL PRIMARY KEY,
    nome      VARCHAR(100) NOT NULL,
    email     VARCHAR(150) NOT NULL UNIQUE,
    senha     VARCHAR(255) NOT NULL,
    role      VARCHAR(20)  NOT NULL DEFAULT 'CLIENTE'
              CHECK (role IN ('ADMIN','GARCOM','COZINHA','CLIENTE')),
    ativo     BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE TABLE categorias (
    id   BIGSERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE
);
CREATE TABLE produtos (
    id           BIGSERIAL PRIMARY KEY,
    nome         VARCHAR(120)   NOT NULL,
    descricao    TEXT,
    preco        DECIMAL(10,2)  NOT NULL,
    categoria_id BIGINT         NOT NULL REFERENCES categorias(id),
    disponivel   BOOLEAN        NOT NULL DEFAULT TRUE,
    imagem_url   VARCHAR(500),
    criado_em    TIMESTAMP      NOT NULL DEFAULT NOW()
);
CREATE TABLE mesas (
    id     BIGSERIAL PRIMARY KEY,
    numero INT         NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'LIVRE'
           CHECK (status IN ('LIVRE','OCUPADA','RESERVADA'))
);
CREATE TABLE comandas (
    id          BIGSERIAL PRIMARY KEY,
    mesa_id     BIGINT        REFERENCES mesas(id),
    usuario_id  BIGINT        NOT NULL REFERENCES usuarios(id),
    status      VARCHAR(20)   NOT NULL DEFAULT 'ABERTA'
                CHECK (status IN ('ABERTA','EM_PREPARO','PRONTA','FINALIZADA','CANCELADA')),
    total       DECIMAL(10,2) NOT NULL DEFAULT 0,
    observacoes TEXT,
    aberta_em   TIMESTAMP     NOT NULL DEFAULT NOW(),
    fechada_em  TIMESTAMP
);
CREATE TABLE itens_comanda (
    id          BIGSERIAL PRIMARY KEY,
    comanda_id  BIGINT        NOT NULL REFERENCES comandas(id),
    produto_id  BIGINT        NOT NULL REFERENCES produtos(id),
    quantidade  INT           NOT NULL DEFAULT 1,
    preco_unit  DECIMAL(10,2) NOT NULL,
    status      VARCHAR(20)   NOT NULL DEFAULT 'PENDENTE'
                CHECK (status IN ('PENDENTE','PREPARO','PRONTO','ENTREGUE','CANCELADO')),
    observacoes VARCHAR(500)
);

INSERT INTO categorias (nome) VALUES ('Lanches'),('Bebidas'),('Sobremesas'),('Pratos'),('Porcoes');
INSERT INTO mesas (numero) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10);
INSERT INTO usuarios (nome, email, senha, role) VALUES
    ('Administrador','admin@comanda.com',   '$2a$10$2rOF8Q0AfzYzNvTmcBg1wOxv6ycgnhARgO0Ii3THTV/67/qTwvzqG','ADMIN'),
    ('Garcom',       'garcom@comanda.com',  '$2a$10$2rOF8Q0AfzYzNvTmcBg1wOxv6ycgnhARgO0Ii3THTV/67/qTwvzqG','GARCOM'),
    ('Cozinha',      'cozinha@comanda.com', '$2a$10$2rOF8Q0AfzYzNvTmcBg1wOxv6ycgnhARgO0Ii3THTV/67/qTwvzqG','COZINHA'),
    ('Cliente App',  'cliente@comanda.com', '$2a$10$2rOF8Q0AfzYzNvTmcBg1wOxv6ycgnhARgO0Ii3THTV/67/qTwvzqG','CLIENTE');
INSERT INTO produtos (nome, descricao, preco, categoria_id) VALUES
    ('X-Burguer','Pao, carne 180g, queijo, alface, tomate',18.90,1),
    ('X-Bacon','Pao, carne 180g, bacon, queijo, alface',22.90,1),
    ('Batata Frita','Porcao 200g crocante com cheddar',12.00,5),
    ('Coca-Cola','Lata 350ml gelada',7.00,2),
    ('Suco de Laranja','Natural 300ml',9.00,2);
