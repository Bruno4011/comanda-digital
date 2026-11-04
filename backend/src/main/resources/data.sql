-- Dados iniciais, executados a cada inicialização (spring.sql.init.mode=always).
-- REGRA: nunca recriar o que o usuário apagou.
--  * Usuários NÃO são semeados aqui: o DataInitializer cria os padrão só na 1a execução.
--  * Produtos de exemplo só entram se a tabela de produtos estiver vazia.

INSERT INTO categorias (nome) VALUES
    ('Lanches'), ('Bebidas'), ('Sobremesas'), ('Pratos'), ('Porcoes')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO mesas (numero, status) VALUES
    (1,'LIVRE'),(2,'LIVRE'),(3,'LIVRE'),(4,'LIVRE'),(5,'LIVRE'),
    (6,'LIVRE'),(7,'LIVRE'),(8,'LIVRE'),(9,'LIVRE'),(10,'LIVRE')
ON CONFLICT (numero) DO NOTHING;

INSERT INTO produtos (nome, descricao, preco, categoria_id, disponivel)
SELECT v.nome, v.descricao, v.preco, c.id, true
FROM (VALUES
    ('X-Burguer',       'Pao, carne 180g, queijo, alface, tomate', 18.90, 'Lanches'),
    ('X-Bacon',         'Pao, carne 180g, bacon, queijo, alface',  22.90, 'Lanches'),
    ('Batata Frita',    'Porcao 200g crocante com cheddar',        12.00, 'Porcoes'),
    ('Coca-Cola',       'Lata 350ml gelada',                        7.00, 'Bebidas'),
    ('Suco de Laranja', 'Natural 300ml',                            9.00, 'Bebidas')
) AS v(nome, descricao, preco, cat)
JOIN categorias c ON c.nome = v.cat
WHERE NOT EXISTS (SELECT 1 FROM produtos);
