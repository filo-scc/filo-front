# Revisão do PR 78 - sugestões

PR: https://github.com/filo-scc/filo-front/pull/78  
Título: Feature/pedidos  
Base: `develop` (`d00bcb8dd834d0b3578fd9a346e3d4a3670671be`)  
Branch: `feature/pedidos`  
Head revisado: `e406dc60ad568d05fc29cc8f03e289fcaea824e8`

Escopo: criação/listagem de pedidos e cálculo de custos de produto.

## Resumo

1 apontamento mantido: o custo de produção é enviado em `custo_total`, campo que o backend disponível não persiste em `Pedido`, enquanto `valor_total` fica nulo.

## Impacto no que já existe

Para fábricas sem produção sob demanda, a lista mostra “Custo” a partir de `pedido.valor_total`. O novo fluxo envia esse valor como nulo, portanto pode criar produções sem custo exibível ou persistido.

## Verificações executadas

```bash
git diff --check d00bcb8dd834d0b3578fd9a346e3d4a3670671be...e406dc60ad568d05fc29cc8f03e289fcaea824e8
pnpm run lint
```

`git diff --check` e ESLint passaram. O build não foi concluído nesta revalidação por limite de execução após o lint; alterações locais não rastreadas foram preservadas.

## 1. Persistir o custo da produção em um campo suportado pelo backend

Severidade: Alta.

Onde:

- `src/pages/PedidosCadastrar.jsx:493-523`
- `src/pages/Pedidos.jsx:185-193`

Trecho:

```jsx
let valorTotalPedido = null;

await createPedido({
    valor_total: valorTotalPedido != null ? Number(valorTotalPedido.toFixed(2)) : null,
    custo_total: Number(custoTotalPedido.toFixed(2)),
});
```

Problema: para produção sem demanda, o PR envia `valor_total: null` e `custo_total`, mas o modelo/DTO de `Pedido` no backend disponível possui apenas `valor_total`; `custo_total` é campo de produto. O custo é ignorado ou a requisição é rejeitada quando campos extras são proibidos.

Por que ocorre: o frontend alterou o contrato do endpoint sem a persistência correspondente no backend. A lista continua lendo `pedido.valor_total` na coluna “Custo”.

Impacto no existente: novas produções podem ficar sem custo registrado e aparecer como R$ 0,00/sem valor, comprometendo o acompanhamento financeiro.

Exemplo: produção de 10 peças e custo calculado de R$ 250 envia `{ valor_total: null, custo_total: 250 }`; ao recarregar, a lista não tem um campo persistido de onde obter R$ 250.

Sugestão: alinhar o contrato antes do merge: persistir `custo_total` em `Pedido` no backend e lê-lo na lista, ou manter uma semântica única no campo já persistido. Cubra criação e leitura posterior com teste.

Mensagem curta para o PR:

```md
Para produção sem demanda, o payload envia `valor_total: null` e coloca o custo em `custo_total`, mas o backend atual não possui esse campo em `Pedido` e a listagem lê `valor_total` como “Custo”. Podemos alinhar o contrato e testar que o custo criado reaparece na listagem?
```

## Pontos reavaliados e não mantidos como correção

- O achado anterior de custo zero por `custo_total` ausente foi substituído: o head atual mudou o fluxo, mas ainda não fecha o contrato de persistência.
- A ordenação por número e a delegação de cor ao backend permanecem compatíveis com os contratos revisados.

## Validação manual recomendada antes do merge

- Criar uma produção não sob demanda com custo conhecido, recarregar a lista e confirmar a persistência e exibição do mesmo custo.
- Criar pedido sob demanda e confirmar que o preço de venda segue persistido em `valor_total`.
