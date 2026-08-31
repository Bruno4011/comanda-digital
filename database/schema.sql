-- ================================================
-- COMANDA DIGITAL — Schema MySQL
-- ================================================

DROP DATABASE IF EXISTS comanda_digital;
CREATE DATABASE comanda_digital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE comanda_digital;

CREATE TABLE usuarios (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome      VARCHAR(100)  NOT NULL,
    email     VARCHAR(150)  NOT NULL UNIQUE,
    senha     VARCHAR(255)  NOT NULL,
    role      ENUM('ADMIN','GARCOM','COZINHA','CLIENTE') NOT NULL DEFAULT 'CLIENTE',
    ativo     BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE produtos (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome         VARCHAR(120)  NOT NULL,
    descricao    TEXT,
    preco        DECIMAL(10,2) NOT NULL,
    categoria_id BIGINT        NOT NULL,
    disponivel   BOOLEAN       NOT NULL DEFAULT TRUE,
    imagem_url   VARCHAR(500),
    criado_em    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE mesas (
    id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero INT         NOT NULL UNIQUE,
    status ENUM('LIVRE','OCUPADA','RESERVADA') NOT NULL DEFAULT 'LIVRE'
);

CREATE TABLE comandas (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    mesa_id     BIGINT        REFERENCES mesas(id),
    usuario_id  BIGINT        NOT NULL,
    status      ENUM('ABERTA','EM_PREPARO','PRONTA','FINALIZADA','CANCELADA') NOT NULL DEFAULT 'ABERTA',
    total       DECIMAL(10,2) NOT NULL DEFAULT 0,
    observacoes TEXT,
    aberta_em   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechada_em  DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE itens_comanda (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    comanda_id  BIGINT        NOT NULL,
    produto_id  BIGINT        NOT NULL,
    quantidade  INT           NOT NULL DEFAULT 1,
    preco_unit  DECIMAL(10,2) NOT NULL,
    status      ENUM('PENDENTE','PREPARO','PRONTO','ENTREGUE','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    observacoes VARCHAR(500),
    FOREIGN KEY (comanda_id) REFERENCES comandas(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

INSERT INTO categorias (nome) VALUES
    ('Lanches'), ('Bebidas'), ('Sobremesas'), ('Pratos'), ('Porções');

INSERT INTO mesas (numero, status) VALUES
    (1,'LIVRE'),(2,'LIVRE'),(3,'LIVRE'),(4,'LIVRE'),(5,'LIVRE'),
    (6,'LIVRE'),(7,'LIVRE'),(8,'LIVRE'),(9,'LIVRE'),(10,'LIVRE');

-- Senha: admin123
INSERT INTO usuarios (nome, email, senha, role) VALUES
    ('Administrador', 'admin@comanda.com',   '$2a$10$2rOF8Q0AfzYzNvTmcBg1wOxv6ycgnhARgO0Ii3THTV/67/qTwvzqG', 'ADMIN'),
    ('Garçom João',   'garcom@comanda.com',  '$2a$10$2rOF8Q0AfzYzNvTmcBg1wOxv6ycgnhARgO0Ii3THTV/67/qTwvzqG', 'GARCOM'),
    ('Cozinha',       'cozinha@comanda.com', '$2a$10$2rOF8Q0AfzYzNvTmcBg1wOxv6ycgnhARgO0Ii3THTV/67/qTwvzqG', 'COZINHA'),
    ('Cliente App',   'cliente@comanda.com', '$2a$10$2rOF8Q0AfzYzNvTmcBg1wOxv6ycgnhARgO0Ii3THTV/67/qTwvzqG', 'CLIENTE');

INSERT INTO produtos (nome, descricao, preco, categoria_id, disponivel) VALUES
    ('X-Burguer',       'Pão, carne 180g, queijo, alface, tomate', 18.90, 1, TRUE),
    ('X-Bacon',         'Pão, carne 180g, bacon, queijo, alface',  22.90, 1, TRUE),
    ('Batata Frita',    'Porção 200g crocante com cheddar',        12.00, 5, TRUE),
    ('Coca-Cola',       'Lata 350ml gelada',                        7.00, 2, TRUE),
    ('Suco de Laranja', 'Natural 300ml',                            9.00, 2, TRUE);
