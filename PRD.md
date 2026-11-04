# PRD — Comanda Digital

## 1. Visão geral

Comanda Digital é um sistema de gestão de pedidos para restaurantes. Ele substitui a comanda de papel por um fluxo digital: quem faz o pedido (cliente na própria mesa, garçom presencial, ou cliente de delivery) registra os itens, e cada estação de preparo responsável (cozinha geral, copa, prato quente, prato frio) recebe e acompanha só o que precisa preparar, em tempo quase real.

## 2. Problema

Comandas em papel têm três problemas recorrentes num restaurante: letra ilegível causando erro de preparo, tempo perdido levando o pedido fisicamente até a cozinha, e nenhuma visibilidade de quanto tempo cada pedido está parado. O sistema ataca os três: entrada estruturada (sem ambiguidade de leitura), transmissão instantânea via API, e um cronômetro visual por comanda que muda de cor conforme o tempo passa.

## 3. Papéis de usuário (personas)

| Papel | Quem é | Objetivo principal |
|---|---|---|
| Admin | Dono/gerente do restaurante | Ver o dia (comandas, mesas), financeiro por período, cadastrar/editar produtos, consultar histórico |
| Garçom | Atendente de salão | Abrir comanda rápido pra uma mesa, saber quando está pronta pra entregar |
| Cozinha | Responsável geral da cozinha | Visão completa de tudo que está em aberto, sem filtro |
| Copa | Responsável por bebidas/sobremesas | Só o que é dele, sem precisar filtrar mentalmente numa lista geral |
| Prato Quente | Responsável pela chapa/fogão | Idem, só os pratos quentes |
| Prato Frio | Responsável por saladas/frios | Idem, só os pratos frios |
| Cliente | Consumidor sentado à mesa | Pedir direto do celular, sem esperar o garçom, sem precisar de conta/login |
| Cliente Delivery | Consumidor em casa | Pedir com entrega, informando endereço e forma de pagamento |

## 4. Requisitos funcionais

### 4.1 Autenticação
- Login por e-mail/senha para os papéis internos (Admin, Garçom, Cozinha, Copa, Prato Quente, Prato Frio); token JWT.
- Cliente e Delivery **não** autenticam — abrem comanda anonimamente, associada opcionalmente a uma mesa.

### 4.2 Cardápio e categorização
- Produtos têm nome, descrição, preço, categoria, disponibilidade (sim/não) e imagem opcional.
- Categorias são livres — o admin pode criar quantas quiser.
- Tanto a tela de Cliente quanto a de Garçom mostram uma barra de filtro com todas as categorias existentes, gerada automaticamente a partir do cadastro (nenhuma tela precisa ser configurada manualmente por categoria).
- Cada estação de preparo (Copa, Prato Quente, Prato Frio) só exibe itens cuja categoria contenha certas palavras-chave pré-definidas (ver seção 7 — regra de negócio importante e não óbvia).

### 4.3 Pedido (Cliente / Garçom / Delivery)
- Adicionar produto ao carrinho com quantidade e observação por item.
- Cliente/Garçom: número de mesa opcional, observação geral.
- Delivery: fluxo adicional de endereço (rua, número, complemento, bairro, cidade, referência, telefone) e forma de pagamento (dinheiro, com campo de troco).
- Ao confirmar, cria uma comanda com status `ABERTA`.

### 4.4 Preparo (Cozinha / Copa / Prato Quente / Prato Frio)
- Lista de comandas atualiza sozinha (poll a cada 3 segundos).
- Cada comanda mostra: número/mesa, status, tempo decorrido (com alerta visual em 8 min e urgência em 15 min), observações, e os itens (filtrados pela estação, exceto Cozinha que vê todos).
- Um botão avança o status: `ABERTA` → `EM_PREPARO` → `PRONTA`.
- Notificação visual quando uma comanda nova entra na fila.

### 4.5 Atendimento (Garçom)
- Aba separada lista comandas prontas para entrega e comandas ativas.
- Ação de finalizar/entregar move a comanda para `FINALIZADA`.

### 4.6 Administração
- Dashboard: relatório do dia, comandas por status, status das mesas (livre/ocupada, com toggle manual).
- Financeiro: relatório por período customizável, faturamento diário em gráfico.
- Produtos: CRUD completo.
- Histórico: consulta de comandas por intervalo de datas, incluindo canceladas.

## 5. Requisitos não funcionais

- **Atualização**: near real-time via polling (3s nas telas de preparo, 30s no dashboard admin) — não é WebSocket/push.
- **Disponibilidade**: hospedagem em camada gratuita (Render + Aiven); mitigada com UptimeRobot para reduzir cold start, mas não elimina o risco de indisponibilidade do provedor.
- **Autenticação**: JWT com chave configurável por variável de ambiente.
- **Portabilidade**: frontend e backend deployáveis separadamente (Netlify / Render), acoplados só por URL de API e CORS.

## 6. Fluxos principais

**Cliente na mesa**: acessa `/cliente` sem login → filtra cardápio por categoria (opcional) → adiciona itens ao carrinho → informa mesa (opcional) → confirma → recebe tela de sucesso → comanda aparece imediatamente na(s) estação(ões) certas.

**Garçom**: login → Nova Comanda → escolhe mesa → monta pedido → envia → acompanha na aba Comandas até aparecer como pronta → entrega/finaliza.

**Estação de preparo**: login → tela já carrega e atualiza sozinha → conforme comandas chegam, avança status conforme prepara → comanda sai da fila ao ficar pronta.

## 7. Regras de negócio importantes

- **Roteamento por categoria é por palavra-chave no nome, não por relação configurável.** Renomear ou criar uma categoria com um nome que não contém as palavras esperadas faz o produto não aparecer em nenhuma estação especializada (continua aparecendo na Cozinha, que não filtra).
- Com as categorias padrão do sistema (Lanches, Bebidas, Sobremesas, Pratos, Porções), a estação Prato Frio nunca recebe itens — nenhuma bate com sua lista de palavras.
- O status de uma comanda só avança para frente; não há ação de "voltar status" na interface.
- Falha de autenticação (usuário inexistente ou senha errada) retorna o mesmo tipo de erro — o sistema não diferencia os dois casos para quem está tentando logar.

## 8. Fora de escopo (nesta versão)

- Processamento real de pagamento (delivery só registra a forma escolhida).
- Notificação push/WebSocket — tudo é polling.
- Edição de comanda depois de aberta pelo cliente (sem ser via Garçom/Admin).
- Múltiplos restaurantes/multi-tenant — o sistema assume uma única unidade.
- Impressão de comanda física.

## 9. Riscos e limitações técnicas conhecidas

- Backend em plano gratuito do Render: sujeito a cold start (~30-60s) se o UptimeRobot falhar ou for desativado.
- Sem diferenciação de erro de login, dificulta suporte a usuários que esquecem a senha vs. digitam e-mail errado.
- Lista de palavras-chave de roteamento está hardcoded no frontend — adicionar uma nova estação ou ajustar categorias exige alteração de código, não só de cadastro.

## 10. Métricas de sucesso sugeridas

- Tempo médio entre `ABERTA` e `PRONTA` por estação.
- % de comandas `CANCELADA` sobre o total (proxy de erro de pedido ou desistência).
- Uso relativo de Cliente (mesa) vs. Garçom para abertura de comandas.
