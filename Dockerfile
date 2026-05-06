# =============================================================================
# Dockerfile — Desenvolvimento Frontend Filó (React + Vite)
# =============================================================================
# Este Dockerfile é voltado para desenvolvimento.
# Não gera build estático (usado em ambientes de prod), rodando o servidor de dev do Vite com hot-reload.
# =============================================================================
FROM node:22-alpine

WORKDIR /app

# Enquanto package.json e package-lock.json não mudarem,
# o npm ci não executa novamente a cada build.
COPY package.json package-lock.json ./

RUN npm ci

# O código-fonte NÃO é copiado aqui ele será montado via volume no compose,
# permitindo que mudanças no host sejam refletidas instantaneamente no container.

EXPOSE 5173

# --host expõe o servidor Vite para fora do container (0.0.0.0).
# Sem esta flag, o Vite só aceita conexões de localhost interno
# e a porta não fica acessível no navegador do host.
CMD ["npm", "run", "dev", "--", "--host"]