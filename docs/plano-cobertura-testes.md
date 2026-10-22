# Plano de cobertura de testes do front

## Objetivo

Implantar testes de forma incremental, priorizando as partes que concentram
regras de comportamento e mantendo a execução integrada ao CI.

## Ferramentas sugeridas

- Node.js 22 com `node:test` e `node:assert/strict`, sem adicionar uma nova
  dependência de teste neste momento.
- ESLint para verificar problemas estáticos.
- Prettier para manter a formatação consistente.
- O comando `npm test` como ponto único de execução dos testes do front.

## Etapas e metas

### Etapa 1: utils

Priorizar funções utilitárias e seus casos de borda, pois são unidades pequenas
e reutilizadas por outras partes do front.

Meta: manter todos os testes existentes passando e adicionar testes para cada
comportamento relevante identificado nas funções utilitárias alteradas.

### Etapa 2: regras de negócio

Adicionar testes para as decisões e validações que determinam o comportamento
das telas e dos fluxos do sistema.

Meta: cada regra de negócio alterada ter um teste que registre o comportamento
esperado e evite regressões.

### Etapa 3: serviços

Adicionar testes nas interfaces públicas dos serviços, cobrindo respostas de
sucesso, erros e transformação dos dados enviados ou recebidos.

Meta: os fluxos de serviço mais importantes terem testes para os cenários
normais e para as falhas esperadas, sem depender de detalhes internos da
implementação.

## Entrada no CI

O CI deve executar, na ordem abaixo, os mesmos checks usados localmente:

```bash
npm run format:check
npm run lint
npm test
npm run build
```

O `npm test` deve usar o script definido no `package.json`:

```bash
node --test "src/utils/**/*.test.js"
```

Essa forma evita depender da expansão de glob pelo shell e permite a execução
no Linux, no PowerShell e no Git Bash.

## Validação multiplataforma

A validação local desta branch ocorre no Linux. Para concluir a validação
prevista pelo ticket DEV-500, alguém com Windows e Node.js 22 deve executar
`npm test` tanto no PowerShell quanto no Git Bash e registrar o resultado no
PR.
