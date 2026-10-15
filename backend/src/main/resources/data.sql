-- Dados iniciais — executado pelo Spring Boot na inicialização
-- INSERT ... ON CONFLICT DO NOTHING garante que não duplica

INSERT INTO categorias (nome) VALUES
    ('Lanches'), ('Bebidas'), ('Sobremesas'), ('Pratos'), ('Porcoes')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO mesas (numero, status) VALUES
    (1,'LIVRE'),(2,'LIVRE'),(3,'LIVRE'),(4,'LIVRE'),(5,'LIVRE'),
    (6,'LIVRE'),(7,'LIVRE'),(8,'LIVRE'),(9,'LIVRE'),(10,'LIVRE')
ON CONFLICT (numero) DO NOTHING;

-- Senha: admin123
INSERT INTO usuarios (nome, email, senha, role, ativo) VALUES
    ('Administrador', 'admin@comanda.com',   '$2a$10$XFlMc8Kv.yP9mwb9IjGmoeyHYpMvzatKbWHuOSlTHU4LrFPaQbr3W', 'ADMIN',   true),
    ('Garcom',        'garcom@comanda.com',  '$2a$10$elq3BwKVOaJImz5BUx262.ByMs6atRHOzSZQRRoi1jqgVnVge1lS6', 'GARCOM',  true),
    ('Cozinha',       'cozinha@comanda.com', '$2a$10$ROMf5ZnyGoAd6Ja90Rr73uP6cFyCBf4FgJ5AYBsq.UMf3QOuQ9SoK', 'COZINHA', true),
    ('Prato Quente', 'prato.quente@comanda.com', '$2a$10$gXZ4UZrA8UOJ452BbQmkcu3Vjbp081IoMw1./IaHYVQxOEzpFBz3G', 'PRATO_QUENTE', true),
('Prato Frio',   'prato.frio@comanda.com',   '$2a$10$V8tgeCeA0jiOdJ1caimaPOhcf39Iu/jzbEtzLbT2nDMMpdm9/0.7q', 'PRATO_FRIO',   true),
('Cliente App',   'cliente@comanda.com', '$2a$10$X12m/tR02Webcqla4Q31FOusvWFOj/cyWlQHyT0SMmJDvYkTBvw76', 'CLIENTE', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO produtos (nome, descricao, preco, categoria_id, disponivel)
SELECT 'X-Burguer', 'Pao, carne 180g, queijo, alface, tomate', 18.90, id, true FROM categorias WHERE nome = 'Lanches'
ON CONFLICT DO NOTHING;

INSERT INTO produtos (nome, descricao, preco, categoria_id, disponivel)
SELECT 'X-Bacon', 'Pao, carne 180g, bacon, queijo, alface', 22.90, id, true FROM categorias WHERE nome = 'Lanches'
ON CONFLICT DO NOTHING;

INSERT INTO produtos (nome, descricao, preco, categoria_id, disponivel)
SELECT 'Batata Frita', 'Porcao 200g crocante com cheddar', 12.00, id, true FROM categorias WHERE nome = 'Porcoes'
ON CONFLICT DO NOTHING;

INSERT INTO produtos (nome, descricao, preco, categoria_id, disponivel)
SELECT 'Coca-Cola', 'Lata 350ml gelada', 7.00, id, true FROM categorias WHERE nome = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO produtos (nome, descricao, preco, categoria_id, disponivel)
SELECT 'Suco de Laranja', 'Natural 300ml', 9.00, id, true FROM categorias WHERE nome = 'Bebidas'
ON CONFLICT DO NOTHING;
