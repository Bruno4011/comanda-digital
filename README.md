# Comanda Digital

Sistema de gestão de pedidos para restaurantes: substitui a comanda de papel por um fluxo digital entre quem faz o pedido (cliente na mesa, delivery, ou garçom) e as estações que precisam prepará-lo (cozinha geral, copa, prato quente, prato frio), com um painel administrativo para produtos, mesas e financeiro.

## Stack

- **Frontend**: Angular 17 (standalone components, sem NgModules)
- **Backend**: Spring Boot 3.2.5 / Java 21, autenticação via JWT
- **Banco de dados**: PostgreSQL, hospedado na Aiven
- **Hospedagem**: Netlify (frontend) + Render (backend, via Docker) + UptimeRobot (mantém o backend acordado)

## Arquitetura

```
Navegador → Netlify (Angular, estático)
                  │
                  ▼
           Render (API Spring Boot)
                  │
                  ▼
           Aiven (PostgreSQL)
```

O `Dockerfile` na raiz do repositório builda o backend; o `frontend/netlify.toml` cuida do roteamento de SPA no Netlify (toda URL cai em `index.html`, o Angular Router assume dali).

## Papéis do sistema

| Papel | Rota | O que vê/faz |
|---|---|---|
| Admin | `/admin` | Dashboard do dia, financeiro por período, CRUD de produtos, histórico de comandas, controle de mesas |
| Garçom | `/garcom` | Abre comanda presencial (escolhe mesa ou balcão), acompanha comandas ativas e prontas para entrega |
| Cozinha | `/cozinha` | Vê **todas** as comandas e itens, sem nenhum filtro por categoria |
| Copa | `/copa` | Vê só itens de categorias que casem com bebida/drink/suco/café/sobremesa/doce |
| Prato Quente | `/prato-quente` | Vê só itens de categorias que casem com prato/lanche/porção/massa/carne/grelhado/sopa |
| Prato Frio | `/prato-frio` | Vê só itens de categorias que casem com salada/entrada/sushi/frio/ceviche/antepasto |
| Cliente | `/cliente` | Faz pedido direto pelo celular/tablet na mesa, sem login |
| Delivery | `/delivery` | Cardápio com fluxo de endereço e forma de pagamento (sem gateway de pagamento real — é só registro) |

Login e senha de todos os papéis internos (menos Cliente/Delivery, que não logam): ver [Credenciais de teste](#credenciais-de-teste).

## Como o roteamento de pedidos por estação funciona

**Importante, porque não é óbvio olhando só a interface**: Copa, Prato Quente e Prato Frio não têm uma relação configurável no banco de dados dizendo "esta categoria pertence a esta estação". Cada uma dessas três telas tem, no próprio código do componente Angular, uma lista fixa de palavras-chave; ela pega o **nome da categoria** de cada produto, normaliza (minúsculo, sem acento) e verifica se contém uma das palavras da lista.

Isso quer dizer:
- Uma categoria chamada "Bebidas" cai na Copa. Uma chamada "Refrigerantes" não cai em lugar nenhum, mesmo sendo obviamente uma bebida — porque a palavra não bate.
- Com as 5 categorias padrão do sistema (Lanches, Bebidas, Sobremesas, Pratos, Porções), a tela de **Prato Frio nunca recebe nada**, porque nenhuma dessas 5 contém palavras da lista dela (salada, entrada, sushi, frio, ceviche...). Só passa a receber pedidos se for criada uma categoria nova com um nome que bata.
- A Cozinha é a exceção: não filtra nada, mostra tudo sempre — ela é um painel geral, não mais uma "estação" como as outras três.

As listas de palavras-chave ficam em `frontend/src/app/features/{copa,prato-quente,prato-frio}/*.component.ts`, nas constantes `CATS_COPA`, `CATS_QUENTE` e `CATS_FRIO`.

## Ciclo de vida de uma comanda

`ABERTA` → `EM_PREPARO` → `PRONTA` → `FINALIZADA` (ou `CANCELADA` a qualquer momento). Cada estação só avança o status para frente com um botão; não existe voltar status pela interface.

## Rodando localmente

**Backend** (precisa de Java 21 e Maven, ou só Docker):
```bash
cd backend
mvn spring-boot:run
```
Por padrão sobe em `localhost:8080`, usando as variáveis de ambiente abaixo (ou os defaults do `application.properties` se não estiverem setadas).

**Frontend** (precisa de Node 20+):
```bash
cd frontend
npm install
npm start
```
Sobe em `localhost:4200`, apontando para `environment.ts` (não o `.prod.ts`).

## Variáveis de ambiente (backend)

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | URL JDBC do Postgres — formato `jdbc:postgresql://host:porta/banco`, não a URI `postgres://` que provedores como Aiven/Render mostram por padrão |
| `DATABASE_USERNAME` | Usuário do banco |
| `DATABASE_PASSWORD` | Senha do banco |
| `JWT_SECRET` | Chave para assinar os tokens — trocar o valor padrão do código antes de ir pra produção |
| `CORS_ORIGIN` | URL do frontend (Netlify) autorizada a chamar a API; aceita múltiplas, separadas por vírgula |
| `PORT` | Injetada automaticamente pelo Render — não precisa configurar |

## Deploy

Frontend no Netlify (`Base directory: frontend`, `Build command: npm run build`, `Publish directory: dist/comanda-digital-frontend/browser`), backend no Render como Web Service Docker (Root Directory vazio, já que o `Dockerfile` da raiz espera esse contexto), banco na Aiven. UptimeRobot pinga uma rota pública do backend a cada poucos minutos pra evitar o "sleep" do plano gratuito do Render.

## Credenciais de teste

Todos com senha `admin123`:

| Papel | E-mail |
|---|---|
| Admin | admin@comanda.com |
| Garçom | garcom@comanda.com |
| Cozinha | cozinha@comanda.com |
| Copa | copa@comanda.com |
| Prato Quente | prato.quente@comanda.com |
| Prato Frio | prato.frio@comanda.com |
| Cliente (app interno) | cliente@comanda.com |

Criados automaticamente na primeira subida do backend, por `backend/src/main/java/com/comanda/config/DataInitializer.java`.

## Limitações conhecidas

- Prato Frio não recebe pedidos com as categorias padrão (ver seção de roteamento acima).
- Delivery registra forma de pagamento escolhida, mas não processa pagamento de verdade — não há integração com gateway.
- Plano gratuito do Render: backend "dorme" depois de ~15 min sem uso (mitigado pelo UptimeRobot); banco gratuito do Render expira em 30 dias — por isso o banco está na Aiven, que não tem esse limite no plano free.
- Erros de login genéricos: o backend retorna o mesmo tipo de erro tanto para "usuário não existe" quanto para "senha errada".
