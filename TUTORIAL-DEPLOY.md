# Tutorial: Colocando o Comanda Digital no Ar

## Visão geral

O projeto tem três partes:

- **Frontend**: Angular 17 (`frontend/`)
- **Backend**: Spring Boot 3.2.5 / Java 21, com login JWT (`backend/`)
- **Banco**: PostgreSQL

Caminho usado neste tutorial — o que se mostrou mais estável pra manter o sistema no ar por tempo indeterminado, sem custo:

```
Navegador do usuário → Netlify (Angular, arquivos estáticos)
                              │
                              ▼
                    Render (API Spring Boot)
                              │
                              ▼
                    Aiven (banco PostgreSQL)
```

Banco na Aiven em vez de no Render porque o Postgres gratuito do Render expira 30 dias após a criação; o da Aiven não tem esse prazo no plano free. UptimeRobot entra no fim do tutorial pra evitar que o backend do Render "durma" por inatividade.

---

## Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Render](https://render.com)
- Conta no [Netlify](https://netlify.com) — dá pra entrar direto com o GitHub
- Conta na [Aiven](https://aiven.io)
- Conta no [UptimeRobot](https://uptimerobot.com)

Sem git instalado, dá pra fazer tudo pelo navegador — o Passo 1 já está adaptado pra isso. A única coisa que você precisa é extrair o `.zip`, usando a função nativa do seu sistema operacional.

---

## Passo 1 — Código no GitHub (sem git, só pelo navegador)

1. **Extraia o zip** no seu computador — função nativa do sistema, não precisa de git:
   - Windows: botão direito no arquivo → **Extrair tudo**
   - Mac: dê duplo clique no arquivo

2. Em github.com, clique no **+** no canto superior direito → **New repository** → dê um nome (ex: `comanda-digital`) → **Create repository**, sem marcar nenhuma opção extra

3. Na página do repositório, clique em **uploading an existing file** (se aparecer) ou em **Add file → Upload files**

4. Abra a pasta extraída, **entre nela**, e selecione tudo o que está **dentro**: as pastas `frontend`, `backend`, `database` e o arquivo `Dockerfile`. Arraste esse conjunto para a área de upload do GitHub.

   ⚠️ O importante é arrastar o **conteúdo** da pasta, não a pasta extraída inteira — senão tudo fica um nível mais fundo (`comanda-digital-main/frontend` em vez de `frontend`), e as configurações dos passos seguintes não vão bater.

   O projeto tem pouco mais de 70 arquivos, dentro do limite de 100 por envio que o GitHub aceita pela interface web. Se aparecer um aviso de excesso de arquivos, suba em duas vezes: primeiro só a pasta `frontend`, depois — de novo em **Add file → Upload files**, na raiz do repositório — `backend`, `database` e `Dockerfile` juntos.

5. Desça a página, escreva uma mensagem de commit, confirme que está marcado **Commit directly to the main branch**, e clique em **Commit changes**

---

## Passo 2 — Banco de dados PostgreSQL na Aiven

1. Em console.aiven.io, crie um novo projeto (se ainda não tiver um) e depois um novo serviço: **PostgreSQL**, plano **Free**
2. Escolha uma região e crie o serviço — leva alguns minutos até ficar "Running"
3. Na página do serviço, aba de conexão, anote:
   - **Host**
   - **Port**
   - **Database name** (geralmente `defaultdb`)
   - **User** (geralmente `avnadmin`)
   - **Password**

⚠️ A Aiven exige conexão criptografada. A `DATABASE_URL` do Passo 3 precisa terminar com `?sslmode=require` — sem isso a conexão é recusada.

> Nota: não precisa rodar `database/schema.sql` ou `database/schema_postgres.sql` manualmente. O backend está configurado com `ddl-auto=update` — o Hibernate cria as tabelas sozinho na primeira conexão, e o `data.sql`/`DataInitializer` populam os dados iniciais (categorias, mesas, usuários de teste) automaticamente.

---

## Passo 3 — Deploy do backend no Render

1. **New +** → **Web Service** → conecte o repositório `comanda-digital`
2. Configure:
   - **Root Directory**: deixe **em branco**. O `Dockerfile` está na raiz do repo e copia arquivos de dentro de `backend/` — apontar o Root Directory para `backend` quebra o build.
   - **Runtime**: Docker (o Render detecta sozinho pelo `Dockerfile`)
   - **Instance Type**: Free
3. Em **Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `DATABASE_URL` | `jdbc:postgresql://HOST:PORT/DATABASE?sslmode=require` (dados do Passo 2) |
| `DATABASE_USERNAME` | User do Passo 2 |
| `DATABASE_PASSWORD` | Password do Passo 2 |
| `JWT_SECRET` | uma string longa e aleatória, só sua — não deixe o valor padrão que está no código |

Não mexa em `PORT`: o Render injeta essa variável sozinho, e o `application.properties` já respeita ela (`${PORT:8080}`).

4. **Create Web Service** e acompanhe o log (a primeira build demora alguns minutos, por causa do Maven)
5. Quando terminar, copie a URL gerada — algo como `https://comanda-digital-backend-xxxx.onrender.com`

---

## Passo 4 — Corrigir a URL da API no frontend

Edite `frontend/src/environments/environment.prod.ts` (pelo ícone de lápis no GitHub) e garanta que aponta pra URL real copiada no Passo 3, com `/api` no final:

```ts
export const environment = {
  production: true,
  apiUrl: 'https://comanda-digital-backend-xxxx.onrender.com/api'
};
```

Desça a página, escreva uma mensagem de commit e confirme **Commit directly to the main branch**.

---

## Passo 5 — Deploy do frontend no Netlify

1. **Add new site** → **Import an existing project** → GitHub → selecione o repositório
2. Configure o build:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/comanda-digital-frontend/browser`
3. Em **Environment variables**, adicione `NODE_VERSION` = `20`

⚠️ O `/browser` no final do publish directory não é opcional — o Angular 17 separa a saída em `dist/<projeto>/browser`, e esquecer isso é a causa mais comum de tela em branco.

4. Antes de dar deploy, crie o arquivo `frontend/netlify.toml` (Add file → Create new file, pelo GitHub) com:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Isso garante o roteamento correto do Angular (toda URL cai em `index.html`, o Angular Router assume dali) — necessário pra qualquer link que abra `/cliente`, `/delivery` etc. direto, sem passar pela navegação interna do app.

5. Clique em **Deploy**. Ao terminar, copie a URL gerada (algo como `https://comanda-digital-xxxx.netlify.app`).

---

## Passo 6 — Liberar o CORS no backend

Com a URL do frontend em mãos, volte ao Render:

1. Abra o Web Service do backend → aba **Environment**
2. Adicione:

| Nome | Valor |
|---|---|
| `CORS_ORIGIN` | `https://comanda-digital-xxxx.netlify.app` (a URL do Passo 5, sem barra no final) |

3. Salve — o Render reinicia o serviço sozinho para aplicar a variável nova

(Se depois você adicionar um domínio próprio, dá pra colocar as duas URLs separadas por vírgula nessa mesma variável.)

---

## Passo 7 — Evitar o "soneca" do Render com UptimeRobot

O plano Free do Render "dorme" o backend depois de ~15 minutos sem uso; a primeira requisição depois disso demora de 30 a 60 segundos. Pra evitar isso:

1. Em uptimerobot.com, crie um monitor novo: tipo **HTTP(s)**
2. URL: uma rota pública da API, por exemplo `https://comanda-digital-backend-xxxx.onrender.com/api/categorias`
3. Intervalo: **5 minutos**

Isso mantém o backend sempre acordado, sem custo.

---

## Passo 8 — Testar

Abra a URL do Netlify. Os usuários abaixo já vêm cadastrados automaticamente (senha `admin123` para todos):

| Papel | E-mail |
|---|---|
| Admin | admin@comanda.com |
| Garçom | garcom@comanda.com |
| Cozinha | cozinha@comanda.com |
| Copa | copa@comanda.com |
| Prato Quente | prato.quente@comanda.com |
| Prato Frio | prato.frio@comanda.com |
| Cliente | cliente@comanda.com |

Entre como admin, confira o cadastro de produtos e mesas, e teste abrir uma comanda pelo fluxo do cliente pra ver se ela aparece do outro lado, na cozinha. Se isso for rodar de verdade num restaurante, vale trocar essas senhas depois do primeiro acesso.

---

## Sobre o plano gratuito

- Banco na Aiven: sem prazo de expiração no plano free (por isso ele, e não o Postgres do Render).
- Backend no Render: dorme sem uso, mitigado pelo UptimeRobot do Passo 7 — mas ainda depende do Render estar no ar.
- Netlify grátis cobre tranquilamente um frontend estático como esse.

Preço e limite de plano gratuito mudam com frequência nessas plataformas — vale conferir as páginas oficiais de cada uma antes de decidir se compensa migrar pra um plano pago, especialmente se o sistema for usado de verdade num restaurante em operação.

---

## Problemas comuns

- **Erro de CORS no console do navegador**: confira se `CORS_ORIGIN` no Render é exatamente igual à URL do Netlify (com `https://`, sem barra no final)
- **Tela branca no Netlify**: quase sempre é o "Publish directory" errado — confirme que termina em `/browser`
- **"Página não encontrada" ao abrir /cliente, /delivery etc. direto**: confirme que `frontend/netlify.toml` existe com a regra de redirect do Passo 5
- **Build do backend falha no Render**: confirme que "Root Directory" ficou vazio
- **Primeira requisição trava ou dá timeout**: se o UptimeRobot estiver configurado, não deveria mais acontecer — confira se o monitor está ativo
- **Erro de conexão com o banco**: confira se `DATABASE_URL` está no formato `jdbc:postgresql://...?sslmode=require`, não `postgres://...`
- **Login de um papel específico não funciona, mas outros funcionam**: confira nos Logs do Render (backend) se aparece uma linha `=== ERRO ao criar <email>` — indica que aquele usuário nunca chegou a ser criado no banco
- **GitHub avisa que são muitos arquivos ao arrastar a pasta**: suba em duas etapas — primeiro `frontend`, depois `backend` + `database` + `Dockerfile` juntos, como descrito no Passo 1
