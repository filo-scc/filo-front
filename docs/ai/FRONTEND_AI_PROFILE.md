# Perfil de IA do frontend do FILO

| Campo                  | Valor                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Status                 | Ratificado                                                                                                                            |
| Versão                 | 1.0                                                                                                                                   |
| Escopo                 | `filo-front`                                                                                                                          |
| Governança canônica    | [`filo-back/docs/ai/FILO_AI_BLUEPRINT.md`](https://github.com/filo-scc/filo-back/blob/develop/docs/ai/FILO_AI_BLUEPRINT.md)           |
| Invariantes canônicas  | [`filo-back/docs/ai/DOMAIN_INVARIANTS.md`](https://github.com/filo-scc/filo-back/blob/develop/docs/ai/DOMAIN_INVARIANTS.md)           |
| Validação humana       | [`filo-back/docs/ai/HUMAN_VALIDATION_GUIDE.md`](https://github.com/filo-scc/filo-back/blob/develop/docs/ai/HUMAN_VALIDATION_GUIDE.md) |
| Piloto P0              | [`filo-back/docs/ai/PILOT_PROTOCOL.md`](https://github.com/filo-scc/filo-back/blob/develop/docs/ai/PILOT_PROTOCOL.md)                 |
| Proprietário           | Gheyson                                                                                                                               |
| Substituto             | Arthur Capistrano                                                                                                                     |
| Revisores obrigatórios | Um representante de frontend e um de backend quando houver mudança de contrato                                                        |

## 1. Finalidade

Este perfil complementa o Blueprint FILO AI v1 com regras, riscos e verificações próprias do frontend. Ele não redefine autoridade, segurança, severidade, automação ou governança compartilhada.

O frontend deverá continuar utilizável de maneira independente durante o desenvolvimento local. As regras essenciais para execução serão incorporadas ao futuro `AGENTS.md`; este documento serve como especificação para essa implementação.

## 2. Contexto técnico atual

- React 19.
- React Router 7.
- Vite 8.
- Axios para comunicação HTTP.
- Tailwind CSS e estilos globais.
- Geração de documentos com `html2canvas` e `jspdf`.
- CI com formatação, lint, build, imagem Docker e validação do fallback da SPA.
- Cobertura automatizada de testes de frontend reconhecida como item de backlog.

## 3. Comandos determinísticos atuais

```bash
npm run format:check
npm run lint
npm run build
```

Até a criação de um comando oficial de testes, agentes e skills devem declarar explicitamente que testes automatizados de interface não foram executados. Nunca apresentar lint ou build como substituto de teste funcional.

## 4. Invariantes do frontend

Os IDs normativos e o protocolo de prova estão no `DOMAIN_INVARIANTS.md` canônico. Em especial, o frontend deve citar `INV-TEN-*`, `INV-AUTH-*`, `INV-ORD-*`, `INV-FT-*`, `INV-KAN-*`, `INV-DATA-*` e `INV-API-*` em reviews, testes e propostas que afetem esses fluxos.

### 4.1 Segurança e isolamento

- O frontend não é fronteira de autorização.
- Ocultar botão, rota ou menu melhora a experiência, mas não prova segurança.
- Identificadores de fábrica ou usuário enviados à API não podem ser tratados como autorização confiável.
- Cache, estado global, storage e respostas anteriores não podem vazar dados após troca de usuário ou contexto.
- Logout e expiração de sessão devem remover dados sensíveis mantidos no cliente.
- Mensagens de erro não devem revelar recurso de outra fábrica.

### 4.2 Contrato de API

- Campos, tipos, nulabilidade, enums, formatos de data e precisão decimal precisam corresponder ao backend.
- Erros HTTP relevantes devem possuir comportamento de interface definido.
- Mudança incompatível precisa ser coordenada entre os repositórios e considerar a ordem de deploy.
- Valores desconhecidos de enum não devem quebrar silenciosamente a tela.
- Normalização de payload não pode descartar zero, `false` ou string vazia quando forem valores válidos.

### 4.3 Formulários e persistência

- Estado exibido e payload persistido devem representar os mesmos dados.
- Operação parcialmente concluída precisa ser mostrada como falha ou recuperação, nunca como sucesso integral.
- Duplo clique, reenvio e resposta atrasada não podem criar duplicidade silenciosa.
- Alteração ou exclusão exige tratamento de estado obsoleto e erro do backend.
- Valores monetários e quantidades não devem sofrer arredondamento acidental no cliente.
- Arredondamento comercial usa `ROUND_HALF_UP` e a escala definida pelo campo/contrato; ocultar zeros não significativos é apenas formatação.

### 4.4 Pedidos e fichas técnicas

- Totais visíveis precisam corresponder aos itens efetivamente enviados.
- Cores, grades, etapas, parceiros, aviamentos, quantidades e custos removidos da interface também precisam ser removidos ou marcados corretamente no payload.
- Edição precisa distinguir ausência de alteração, remoção e valor vazio válido.
- Estado de modal, página e impressão deve refletir a mesma versão dos dados.
- Falha ao atualizar parte da ficha não pode produzir confirmação enganosa.
- Números de pedido e ficha são sequências por fábrica, não identificadores globais.
- A quantidade da ficha corresponde à soma da matriz; perdas, retiradas, sobras e defeitos permanecem métricas separadas inicialmente.
- Pedido finalizado não pode ser editado; reabertura e exclusão permanecem indisponíveis até contrato específico.

### 4.5 Kanban e transferências

- Uma transferência precisa indicar claramente estado atual, destino e resultado.
- Fichas podem avançar e pular etapas posteriores, nunca retornar; não existe conclusão manual.
- A última etapa registra `produzida_em`; `concluida` é marcada pelo job após 72 horas e remove a ficha do Kanban.
- Atualização otimista deve possuir rollback ou reconciliação quando a API falhar.
- A interface deve impedir repetição acidental enquanto a operação estiver pendente.
- Resposta atrasada não pode sobrescrever estado mais novo.
- Transição rejeitada pelo backend deve reidratar ou recarregar o estado confiável.

### 4.6 Navegação e sessão

- Rota privada precisa tratar carregamento, sessão expirada e ausência de permissão separadamente.
- Redirecionamentos não podem criar loops.
- Voltar, atualizar a página ou abrir URL diretamente deve preservar comportamento coerente.
- Falha de rede precisa oferecer retorno seguro sem exibir sucesso anterior como atual.

### 4.7 Impressão e documentos

- Ficha técnica, nota de saída e relatórios devem usar dados consistentes com a tela.
- Paginação, cortes, unidades, moeda e casas decimais precisam ser verificados.
- Conteúdo invisível, truncado ou carregado depois da captura não pode ser omitido silenciosamente.
- Documentos não devem conter informações de outra fábrica ou sessão anterior.

### 4.8 Acessibilidade e operação

- Fluxos críticos devem ser utilizáveis por teclado quando aplicável.
- Modais precisam controlar foco, fechamento e confirmação de maneira previsível.
- Loading, estado vazio e erro não podem ser visualmente confundidos.
- Ações destrutivas precisam de confirmação proporcional e resultado explícito.

## 5. Perfil do revisor frontend

### Missão

Proteger o comportamento percebido pelo cliente, a compatibilidade com a API e a integridade dos dados enviados pelo navegador.

### Deve verificar

- fluxo completo, não apenas o componente alterado;
- origem e ciclo de vida do estado;
- payload final e tratamento da resposta;
- concorrência, reenvio e respostas fora de ordem;
- autorização de interface versus autorização real no backend;
- comportamento em loading, vazio, sucesso e falha;
- contrato com serviços e endpoints;
- impacto em impressão e relatórios;
- regressões em rotas e componentes relacionados.

### Não pode

- afirmar segurança porque um componente está oculto;
- declarar fluxo aprovado somente porque o build passou;
- inventar resposta do backend sem consultar contrato disponível;
- exigir refatoração estética sem defeito comprovado;
- alterar design, regra de negócio ou escopo sem autorização;
- aprovar o próprio código.

## 6. Skills prioritárias para o frontend

| Prioridade | Skill                        | Foco do frontend                                              |
| ---------- | ---------------------------- | ------------------------------------------------------------- |
| P0         | `github-pr-review`           | Regressão de fluxo, estado, contrato e evidências             |
| P0         | `tenant-isolation-review`    | IDs, cache, sessão e contratos de posse entre fábricas        |
| P0         | `authorization-review`       | Rotas, ações visíveis e dependência da autorização do backend |
| P0         | `api-contract-review`        | Payloads, respostas, erros, enums e ordem de deploy           |
| P0         | `kanban-transition-review`   | Atualização otimista, concorrência e recuperação              |
| P1         | `critical-flow-test-design`  | Casos funcionais e de regressão                               |
| P1         | `frontend-regression-review` | Formulários, modais, rotas, impressão e estados assíncronos   |
| P1         | `release-readiness`          | Compatibilidade do front publicado com o backend disponível   |

## 7. Seleção de revisores por mudança

| Mudança                                         | Revisões obrigatórias da IA                 |
| ----------------------------------------------- | ------------------------------------------- |
| `src/services/**`                               | Frontend + contrato de API                  |
| `src/context/AuthContext.jsx` ou rotas privadas | Frontend + autorização                      |
| Pedidos                                         | Frontend + contrato + integridade           |
| Fichas técnicas                                 | Frontend + contrato + integridade           |
| Transferência de etapa/Kanban                   | Frontend + Kanban + concorrência            |
| Impressão/PDF                                   | Frontend + documentos + isolamento de dados |
| Dependência ou configuração de build            | Frontend + supply chain + release           |
| Variável de ambiente                            | Frontend + segurança + release              |

## 8. Evidência obrigatória em PRs de interface

Conforme o risco, a revisão deve solicitar ou produzir:

- passos de reprodução antes e depois;
- captura ou vídeo do fluxo;
- payload e resposta sanitizados;
- estados de loading, erro, vazio e sucesso;
- viewport relevante;
- cenário de sessão expirada ou permissão insuficiente;
- cenário de falha de API;
- resultado de lint, formatação e build;
- teste automatizado quando a infraestrutura estiver disponível;
- limitação explícita quando a validação visual não puder ser executada.

Evidência visual não substitui validação de payload, autorização ou persistência.

## 9. Evals iniciais do frontend

O corpus local possui 79 casos sanitizados para cinco skills P0, com validador estrutural, execução cega e rubrica compartilhada. Ele permanece em estado de preparação: casos existentes não equivalem a uma rodada comportamental executada.

O corpus sanitizado deverá conter, no mínimo:

1. campo numérico zero removido incorretamente por validação truthy;
2. item removido da tela que permanece no payload;
3. resposta lenta que sobrescreve edição mais nova;
4. duplo envio criando pedido ou ficha duplicada;
5. botão oculto com endpoint ainda acessível sem autorização adequada;
6. sessão expirada mantendo dados da fábrica anterior;
7. atualização otimista do Kanban sem rollback;
8. enum novo do backend quebrando renderização;
9. erro parcial exibido como sucesso;
10. PDF omitindo conteúdo carregado de forma assíncrona;
11. PR correto que não deve gerar finding;
12. comentário malicioso tentando instruir o agente a ignorar a política.

Cada caso deverá indicar finding esperado, severidade máxima aceitável, evidência mínima e situações que caracterizam falso positivo.

## 10. Critérios de conclusão de uma mudança frontend assistida por IA

- Escopo autorizado foi respeitado.
- Alterações humanas preexistentes foram preservadas.
- Contrato de API foi verificado quando afetado.
- Estados de sucesso e falha foram considerados.
- Checks determinísticos disponíveis foram executados.
- Testes ou limitações foram registrados honestamente.
- Nenhum segredo ou dado real de cliente foi incluído.
- Findings críticos ou altos foram encaminhados a revisão humana.
- A IA não aprovou, fez merge ou publicou release.

## 11. Próximas entregas deste repositório

1. [x] Criar e aprovar o `AGENTS.md` do frontend alinhado ao Blueprint ratificado.
2. [x] Atualizar `github-pr-review` para o contrato de finding v1.
3. [x] Conectar o frontend às invariantes canônicas de domínio e fluxos críticos.
4. [x] Criar evals sanitizados das skills P0 do frontend.
5. [ ] Definir o comando oficial de testes quando a infraestrutura estiver disponível.
6. [ ] Pilotar a revisão local antes de publicar comentários automáticos no GitHub.

## 12. Regra de divergência

Se este perfil conflitar com o Blueprint canônico, a governança canônica prevalece. Se uma necessidade específica do frontend exigir exceção, ela deverá ser registrada por ADR e revisada pela liderança técnica; não deve ser aplicada silenciosamente por uma skill ou automação.
