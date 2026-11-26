# customer-expense-web

Front-end em Angular para dois back-ends Spring Boot de estudo:

- [customer-api](https://github.com/jxxErick/customer-api) — cadastro de clientes com endereço pelo ViaCEP (porta **8080**)
- [expense-split-api](https://github.com/jxxErick/expense-split-api) — divisão de despesas em grupo (porta **8081**)

## Stack

- Angular 18 com **standalone components**, **signals** e o novo control flow (`@if`, `@for`, `@switch`)
- Reactive Forms · `HttpClient` com interceptor funcional · rotas com lazy loading
- CSS próprio (sem biblioteca de componentes), locale `pt-BR` para datas e moeda

## Telas

### Clientes

| Tela | O que usa da API |
| --- | --- |
| Lista com busca, paginação e clientes por estado | `GET /customers?name=&page=`, `GET /customers/stats` |
| Exportar CSV | `GET /customers/export?name=` |
| Novo cliente | `POST /customers` com `Idempotency-Key` (duplo clique não cria dois) |
| Detalhe: renomear, trocar endereço, excluir | `PATCH /{id}/name` e `PUT /{id}/address` com `If-Match`; um `412` recarrega a tela |
| Histórico de alterações | `GET /{id}/history` |
| Prováveis duplicados com "manter este e mesclar o outro" | `GET /customers/duplicates?minScore=`, `POST /{id}/merge` |

### Grupos de despesas

| Aba | O que usa da API |
| --- | --- |
| Despesas: lista e nova despesa (igual, valores exatos, porcentagem ou cotas) | `GET/POST/DELETE /groups/{id}/expenses` |
| Comanda: itens com quem consumiu cada um, taxa de serviço e desconto, com **prévia ao vivo** de quanto cada um paga | `POST /expenses/receipt/preview` e `POST /expenses/receipt` |
| Saldos e acertos: saldos, plano simplificado, registrar um acerto ou **quitar tudo** | `/balances`, `/debts`, `/settlements`, `/settlements/settle-up` |
| Membros: adicionar, sair do grupo e voltar | `POST /members`, `DELETE /members/{memberId}` |
| Atividade com "carregar mais" (paginação por cursor) | `GET /activity?before=` |
| Relatório por categoria e por membro | `GET /reports/spending` |

Erros da API chegam no padrão RFC 7807; o `problemInterceptor` transforma o `detail` (ou os
erros por campo) num aviso no canto da tela, então nenhuma tela precisa tratar erro na mão. A prévia
da comanda é a exceção: ela roda enquanto se digita, então marca a requisição com `SILENT_ERRORS`
(um `HttpContextToken`) e mostra o erro dentro do próprio card em vez de disparar um aviso a cada tecla.

## Estrutura

```
src/app/
  core/        interceptor de erros (problem+json) e serviço de avisos
  customers/   models, CustomerService e as telas de clientes
  groups/      models, GroupService, lista/detalhe do grupo
    panels/    uma aba por componente (despesas, comanda, saldos, membros, atividade, relatório)
src/environments/environment.ts   URLs das duas APIs
```

## Como rodar

Suba as duas APIs (cada uma no seu repositório):

```bash
# customer-api → http://localhost:8080
mvn spring-boot:run
# expense-split-api → http://localhost:8081
mvn spring-boot:run
```

E o front:

```bash
npm install
npm start
```

Abra <http://localhost:4200>. As APIs liberam essa origem no CORS (`cors.allowed-origins`, ou a
variável `CORS_ALLOWED_ORIGINS` para outra origem). Para apontar para outro endereço, troque as URLs
em `src/environments/environment.ts`.

```bash
npm run build   # gera dist/customer-expense-web
```
