# Revisão do PR 99 — filo-front

PR: https://github.com/filo-scc/filo-front/pull/99

Título: Feature/pedidos

Base: `develop` (`b4a54101170f199633e8284218dd74fa480b7134`)

Branch: `feature/pedidos`

Head revisado: `a10a4cc2358bddaafa00169c342bb3236ffb1d0c`

Modo de inspeção: `isolated`

Escopo: diff completo do frontend, cadastro/edição/detalhe de pedidos, rascunho de ficha, data prevista, retry idempotente e contrato pareado com o PR filo-back#79 no head `3230afc7185837ccfd64ceb88479b5fad760f45b`.

## Resumo executivo

Nenhum finding mantido no frontend. A correção de `data_prevista` elimina a normalização silenciosa de datas impossíveis, bloqueia o envio nas telas de cadastro e edição e adiciona regressões para fevereiro, meses com 30 dias e ano bissexto. Nenhum finding novo surgiu na revisão pareada.

## Cobertura de risco

- Isolamento entre fábricas: a tela não envia `fabrico_id` como prova de acesso e o backend pareado deriva a fábrica da sessão; não foi encontrado novo vazamento de estado entre fábricas.
- Autenticação e autorização: rotas permanecem sob os guards existentes; a segurança do recurso continua aplicada pelo backend pareado.
- Pedidos e fichas técnicas: revisados cadastro, edição, remoção local, preservação de fichas não editadas, troca de cliente, totais exibidos e detalhe.
- Kanban, etapas e concorrência: revisados envio da etapa inicial e retry. A transferência por múltiplas chamadas é preexistente e não foi agravada por este PR.
- Integridade, precisão e migrations: sem migration neste repositório; preços, quantidades e datas enviados foram comparados aos DTOs do backend.
- Contrato entre frontend e backend: `POST/PUT /pedidos/completo`, campos opcionais, `null`, matriz, parceiros, data ISO e `Idempotency-Key` coincidem com o PR filo-back#79.

## Impacto no comportamento existente

O PR troca a sequência de várias chamadas por criação/edição completa no backend, mantém uma chave idempotente enquanto o payload é idêntico e passa a editar fichas por rascunho local. A correção adicional valida o calendário antes de produzir o ISO: entradas como `31/02/2026` e `29/02/2026` agora exibem erro e não fazem requisição, enquanto `29/02/2024` é preservada.

## Verificações

```bash
pnpm run lint
pnpm run test
pnpm run build
```

Todos passaram no head revisado. Foram executados 6 testes de `dataPrevistaParaBackend`. O build emitiu apenas avisos informativos de `caniuse-lite` desatualizado e bundle maior que 500 kB. Os checks remotos `Validate PR Flow`, `Lint, Format & Build` e `Validate Production Image` também concluíram com sucesso no mesmo head.

## Limitações globais

- Não foi executado teste E2E em navegador com backend e banco reais.
- Os findings conhecidos do backend pareado permanecem documentados em `filo-back/review-pr-79.md`; eles não são findings do frontend.

## Pontos reavaliados e não mantidos como correção

- O finding anterior de data foi encerrado: a função compara ano, mês e dia UTC e as telas impedem o envio quando a conversão retorna `null` para uma entrada completa.
- A chave de idempotência é renovada quando o payload serializado muda e reutilizada somente no retry do mesmo corpo; o fluxo normal está alinhado ao backend pareado.
- Fichas persistidas não abertas no modal enviam payload parcial intencionalmente; o backend preserva matriz/parceiros omitidos e valida que a quantidade coincide com a matriz persistida.
- O cálculo de próximo número exibido na tela pode ficar defasado sob concorrência, mas é apenas informativo; o backend pareado aloca e persiste o número sob lock.
- A sequência legada de transferência de etapa continua não atômica, mas é preexistente e não foi ampliada pelo diff.

## Validação manual recomendada antes do merge

- Cadastrar e editar pedidos com `31/02/2026`, `29/02/2026`, `31/04/2026` e `29/02/2024`, confirmando bloqueio das três primeiras datas inválidas e persistência exata da data válida.
- Simular retry da criação sem alterar o formulário e confirmar um único pedido; alterar o payload e confirmar nova criação com chave renovada.
- Trocar o cliente de um pedido com fichas existentes e conferir referências, preços e payload final em fabricação sob demanda.
