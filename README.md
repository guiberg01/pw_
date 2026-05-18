<div align="center">  

  <img width="170" height="56" alt="image" src="https://github.com/user-attachments/assets/e18928f6-64e5-47fa-b4a2-b62bb31583c5" />
  
  # TánaMão Marketplace

  **Uma plataforma completa de marketplace projetada com foco em resiliência, distributed locks e split financeiro automatizado.**

  [![Next.js](https://img.shields.io/badge/Next.js_14-App_Router-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express_API-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_ACID-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Redis](https://img.shields.io/badge/Redis-Distributed_Locks-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
  [![Stripe](https://img.shields.io/badge/Stripe-Connect_Marketplace-008ECF?style=flat-square&logo=stripe&logoColor=white)](https://stripe.com/)

</div>

---

## Sobre o Projeto

O **TánaMão** é um ecossistema full-stack de marketplace baseado no modelo de múltiplos lojistas independentes. O foco absoluto do projeto foi aumentar a praticidade do usuário implementando carrinho persistido com redis podendo utilizar o carrinho sem estar logado, conta stripe sem onboarding obrigatório (vendedor pode vender sem ter que fazer 100% do onboarding do stripe) entre outras funcionalidades.

### Principais Funcionalidades

* **Ecossistema Multi-Vendor:** Fluxos isolados para Clientes, Lojistas (Sellers) e Administradores globais da plataforma, com dashboards reativos de métricas e vendas.
* **Split de Pagamentos com Stripe Connect:** Checkout transparente integrado via *Stripe Payment Elements*. O sistema liquida a compra em uma única cobrança unificada, calcula as taxas de comissão da plataforma e roteia os lucros líquidos automaticamente para as carteiras digitais de cada lojista (*payouts*).
* **Frete Múltiplo Consolidado:** Integração assíncrona com a API do **Melhor Envio**. Se um carrinho tiver produtos de 3 lojas em locais diferentes, o backend calcula as rotas e fraciona o checkout em pacotes separados de forma transparente.
* **Proteção de Estoque Concorrente:** Mecanismo de **Distributed Lock** gerenciado via Redis, blindando o inventário contra vendas duplicadas em cenários de acessos simultâneos em massa.
* **Idempotência de Webhooks:** Camada estrita de segurança contra duplicidade de processamento financeiro por parte das mensagens do gateway de pagamento, protegendo os estados de transição de pedidos.

---

## Arquitetura

A engenharia do ecossistema foi estruturada sob os pilares do **SOLID**, isolamento de domínios e alta resiliência na persistência de dados:

* **Padrão de Deleção Lógica Global (Soft Delete Plugin - `softDelete.plugin.js`):** Para garantir a integridade histórica dos dados e a conformidade com auditorias fiscais e de vendas, foi implementado um mecanismo customizado de *Soft Delete* injetado a nível de esquema no Mongoose. Em vez de expurgar fisicamente os registros do banco de dados o sistema utiliza middlewares de query para interceptar automaticamente métodos de leitura (`find`, `findOne`, `findOneAndUpdate`, `countDocuments`) ocultando os registros marcados com a flag `isDeleted: true` de forma totalmente transparente para a camada de negócios.
* **Mecanismo de Lock por Chave Exclusiva:** Antes de validar o estoque de uma variante, o backend adquire uma trava atômica atrelada ao ID do produto no Redis. A linha de execução concorrente aguarda a liberação do recurso, prevenindo inconsistências no banco NoSQL.
* **Validações Robustas de segurança:** Diversas camadas de segurança pra garantir autenticidade e proteção, com helmet, rate limiting, zod, JWT e cookies httponly.

---

## Pré-requisitos e Instalação

Para rodar a aplicação localmente, você precisará ter o **Node.js (v18+)**, instâncias funcionais do **MongoDB** e do **Redis** (locais ou via Docker/Nuvem).

### 1. Clonar o Repositório
```bash
git clone [https://github.com/guiberg01/pw_marketplace.git](https://github.com/guiberg01/pw_marketplace.git)
cd pw_marketplace
```
### 2. Baixando dependências do backend
```bash
# entrar na pasta backend
cd backend

# baixar as dependências
npm install
```
### 3. Configurar variáveis de ambiente do backend
Crie um arquivo `.env` na raiz do projeto. Preencha-o obrigatoriamente com:
```bash
PORT=3980
ALLOWED_ORIGINS=coloque_aqui_seu_dominio_se_for_vazio_vai_permitir_tudo
NODE_ENV=development
MONGO_URI=conexao_do_mongodb_aqui
REDIS_URL=conexao_do_redis_aqui
REFRESH_TOKEN=seu_refresh_token
ACCESS_TOKEN=seu_access_token
RATE_LIMIT_STORE=redis
RATE_LIMIT_FAIL_MODE=memory
MONGO_TRANSACTION_RETRIES=3
UPLOAD_MAX_IMAGE_MB=5
TRUST_PROXY=false
DNS_SERVERS=8.8.8.8,8.8.4.4
COUPON_EXPIRING_NOTIFY_DAYS=3
COUPON_EXPIRATION_LOCK_TTL_MS=45000
COUPON_EXPIRATION_INTERVAL_MS=300000

STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_segredo_de_webhook_aqui

MELHORENVIO_ENV=sandbox
MELHOR_ENVIO_CALCULATE_ENDPOINT=/api/v2/me/shipment/calculate
MELHOR_ENVIO_CLIENT_ID=seu_client_id_aqui
MELHOR_ENVIO_CLIENT_SECRET=melhorevio_client_secret_aqui
MELHOR_ENVIO_OAUTH_SCOPE=shipping-calculate shipping-companies cart-read cart-write
MELHORENVIO_TOKEN=bearer_seu_token_do_melhor_envio_aqui
MELHOR_ENVIO_WEBHOOK_URL=https://seu_dominio_aqui/api/webhooks/melhorenvio/events
MELHOR_ENVIO_WEBHOOK_SECRET=h0V6f0NHuaWrQxwcoTTxXw9Ek4lWsdP6akQGGrdB
MELHOR_ENVIO_REDIRECT_URI=https://seu_dominio_aqui/api/shipping/auth/callback

CLOUDINARY_URL=sua_chave_do_cloudinary_aqui
```
### 4. Baixando dependências do frontend
```bash
cd .. #para voltar pra pasta raiz
cd frontend

npm install
```
### 5. Configurar variáveis de ambiente do frontend
Crie um arquivo `.env.local` dentro da pasta frontend. Preencha-o obrigatoriamente com:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=public_stripe_key_aqui
NEXT_PUBLIC_API_URL=https://seu_dominio/api
```
### 6. Rodar a aplicação
```bash
npm run dev
```
---

## Imagens de algumas abas
### Home 1
<img width="1907" height="927" alt="image" src="https://github.com/user-attachments/assets/0b56bf35-0cf6-440b-99f8-513cd6e88727" />

### Home 2
<img width="1919" height="925" alt="image" src="https://github.com/user-attachments/assets/a9832da2-780d-4b33-a03d-17a574552281" />

### Login
<img width="1920" height="926" alt="image" src="https://github.com/user-attachments/assets/0136e193-13a2-4ece-b8a2-d75ff222eb98" />

### Cadastro
<img width="1914" height="923" alt="image" src="https://github.com/user-attachments/assets/ca38cd5b-55ef-4b27-939d-9388a1bacb66" />

### Onboarding seller
<img width="1908" height="920" alt="image" src="https://github.com/user-attachments/assets/1247fe19-e6c9-4a91-8a74-e2872b4972ec" />
