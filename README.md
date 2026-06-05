# Filo Frontend

O **Filo Frontend** é a interface do projeto Filo, desenvolvida para visualizar e gerenciar o fluxo de produção têxtil — Kanban de etapas, clientes, facções, produtos e fichas técnicas.

## Tecnologias

- **Framework:** [React](https://react.dev/) com [Vite](https://vitejs.dev/)
- **Linguagem:** TypeScript
- **Containerização:** Docker & Docker Compose
- **Servidor de Dev:** Vite HMR (Hot Module Replacement)


## Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) (**Recomendado**)
- Ou [Node.js](https://nodejs.org/) (v18+) e [npm](https://www.npmjs.com/) (para execução local)

> O backend deve estar rodando antes de subir o frontend — ele é quem cria a rede `filo-network` usada pelos containers.


## Quick Start (Docker)

Esta é a forma recomendada para garantir que toda a equipe trabalhe no mesmo ambiente.

1. **Clone o repositório:**
   ```bash
   # git clone
   git clone https://github.com/filo-scc/filo-front.git

   # ou através do github cli
   # gh repo clone filo-scc/filo-front

   cd filo-front
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   # Linux
   cp .env.example .env
   ```

   *O `.env` gerado já vem com os valores padrão para desenvolvimento local, normalmente não é necessário alterar nada.*

3. **Certifique-se de que o backend está rodando:**
   ```bash
   # No repositório do backend
   docker compose up -d
   ```

4. **Suba o frontend (primeira vez):**
   ```bash
   docker compose up --build
   ```

   *O `--build` é necessário apenas na primeira vez ou quando houver mudanças no `package.json`.*

5. **Uso diário:**
   ```bash
   docker compose up
   ```

   Acesse em: **http://localhost:5173**


## Hot-reload

O container roda o servidor de desenvolvimento do Vite, não um build estático. Isso significa que qualquer alteração em arquivos `.tsx`, `.ts` ou `.css` é refletida automaticamente no browser, sem necessidade de reiniciar o container.

**Quando é necessário rebuildar (`--build`):**

| Situação | Rebuild necessário? |
|---|---|
| Alterar código `.tsx`, `.ts`, `.css` | ❌ |
| Alterar `.env` | ❌ |
| Instalar nova dependência | ✅ |
| Primeira vez subindo | ✅ |

**Instalando uma nova dependência:**
```bash
# 1. Instale no host
npm install nome-do-pacote

# 2. Rebuilde para instalar dentro do container também
docker compose up --build
```


## Execução Local (sem Docker)

```bash
npm install
npm run dev
```

Acesse em: **http://localhost:5173**


---

## Outros Pontos

- **Rede:** O frontend se conecta à rede `filo-network` criada pelo backend. Se o backend não estiver rodando, o compose retorna erro de rede não encontrada.
- **Variáveis de ambiente:** Em modo dev, o Vite lê o `.env` em runtime, alterar `VITE_API_URL` e salvar já reflete sem rebuild.
