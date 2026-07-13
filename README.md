# Growth AI Challenge

Aplicação web para exibição de um catálogo de produtos com geração automática de conteúdo de marketing (benefícios e perguntas frequentes) via IA. O conteúdo gerado é cacheado em memória e pode ser regenerado sob demanda.

## Tecnologias

- Next.js 16 (App Router)
- React 19
- TypeScript
- OpenAI Node SDK (Responses API, Structured Outputs)
- n8n (automação do fluxo de enriquecimento via webhook)

## Funcionalidades

- Listagem de produtos na página inicial, lidos a partir de `data/products.json`.
- Página de detalhes de cada produto, com tratamento de produto inexistente (`notFound`).
- Geração de conteúdo por IA para cada produto: 2 a 3 benefícios objetivos e exatamente 3 perguntas frequentes com respostas.
- Cache em memória por `productId`, evitando novas chamadas à IA para um produto já processado.
- Regeneração de conteúdo sob demanda (botão "Regenerar"), ignorando o cache e substituindo o conteúdo armazenado.
- Validação de payload na API (`productId`, `productTitle`, `productDescription`, `category` obrigatórios e não vazios).
- Validação em runtime da resposta da IA, tanto no servidor quanto no cliente, antes de exibir ou cachear qualquer conteúdo.
- Tratamento de erros com mensagens amigáveis para o cliente e log detalhado apenas no servidor.
- Fluxo n8n que expõe a geração de conteúdo via webhook HTTP, com caminhos distintos de sucesso e erro.

## Estrutura do projeto

```
app/
  page.tsx                     # listagem de produtos
  product/[id]/page.tsx        # página de detalhes do produto
  api/enrich-product/route.ts  # endpoint de geração de conteúdo por IA
components/
  ProductAIWidget.tsx           # widget client-side de conteúdo gerado por IA
data/
  products.json                 # catálogo de produtos utilizado pela aplicação
types/
  product.ts                    # tipagem do produto do catálogo
  enrich-product.ts              # tipagem do contrato da API de enriquecimento
n8n/
  flow.json                     # exportação do fluxo de automação do n8n
```

## Como executar

Instalação:

```bash
npm install
```

Configuração:

Criar um arquivo `.env.local` na raiz do projeto contendo:

```
OPENAI_API_KEY=sua_chave
```

Execução:

```bash
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

## Como testar

- **Navegação entre produtos**: acesse `http://localhost:3000`, clique em "Ver detalhes" em qualquer produto da lista e confirme que título, categoria e descrição são exibidos na página do produto.
- **Geração de conteúdo**: ao abrir a página de um produto, o widget de IA dispara automaticamente a primeira geração e exibe os benefícios e as perguntas frequentes assim que a resposta chega.
- **Botão Regenerar**: clique em "Regenerar" na página do produto; o botão fica desabilitado durante o carregamento e o conteúdo exibido é substituído pelo novo resultado.
- **Endpoint `/api/enrich-product`**: pode ser chamado diretamente com uma ferramenta HTTP (curl, Postman, Invoke-RestMethod), enviando o payload descrito na seção API abaixo.
- **Fluxo n8n**: importe `n8n/flow.json` em uma instância do n8n, ative o workflow e envie uma requisição POST para o endpoint `/webhook/produto` exposto por ele, com a aplicação Next.js rodando em `localhost:3000`.

## API

### `POST /api/enrich-product`

Gera benefícios e perguntas frequentes para um produto, com cache em memória por `productId`.

**Query string opcional:**

- `?regenerate=true` — ignora o cache e força uma nova geração, substituindo o conteúdo armazenado.

**Payload esperado:**

```json
{
  "productId": "001",
  "productTitle": "Tênis Running Pro X200",
  "productDescription": "Tênis de corrida com solado de borracha carbono, cabedal em mesh respirável, amortecimento EVA duplo e drop de 8mm. Indicado para treinos de longa distância em asfalto.",
  "category": "Calçados Esportivos"
}
```

Todos os campos são obrigatórios e devem ser strings não vazias.

**Resposta de sucesso (200):**

```json
{
  "bullets": [
    "Amortecimento EVA duplo para maior conforto em treinos longos",
    "Solado de borracha carbono com boa aderência no asfalto",
    "Cabedal em mesh respirável"
  ],
  "faqs": [
    {
      "question": "Qual o drop deste tênis?",
      "answer": "O drop é de 8mm."
    },
    {
      "question": "Para que tipo de treino ele é indicado?",
      "answer": "É indicado para treinos de corrida de longa distância em asfalto."
    },
    {
      "question": "Qual o material do cabedal?",
      "answer": "O cabedal é em mesh respirável."
    }
  ]
}
```

**Respostas de erro:**

- `400` — campo obrigatório ausente, vazio ou de tipo inválido:

```json
{ "message": "productTitle is required and must be a non-empty string." }
```

- `400` — corpo da requisição não é um JSON válido:

```json
{ "message": "Invalid JSON body." }
```

- `500` — chave da OpenAI não configurada no servidor:

```json
{ "message": "AI service is not configured." }
```

- `500` — falha ao gerar ou validar o conteúdo retornado pela IA:

```json
{ "message": "Failed to generate product enrichment." }
```

## Workflow n8n

O arquivo `n8n/flow.json` contém um fluxo que expõe a geração de conteúdo por meio de um webhook HTTP, seguindo o padrão:

```
Webhook (POST /produto)
  -> HTTP Request (POST /api/enrich-product)
       -> caminho de sucesso -> Respond to Webhook (200)
       -> caminho de erro    -> Respond to Webhook (erro)
```

O webhook recebe a requisição, repassa os dados para o endpoint da aplicação e, de acordo com o resultado da chamada, monta uma resposta padronizada (`success` mais o conteúdo gerado ou uma mensagem de erro) antes de responder ao chamador original.

## Decisões técnicas

- As páginas de listagem e de detalhes são Server Components, lendo o catálogo diretamente de `data/products.json` sem necessidade de busca em cliente.
- `ProductAIWidget` é um Client Component (`"use client"`), pois depende de estado local e efeitos (`useState`, `useEffect`, `useCallback`) para buscar e regenerar o conteúdo.
- O cache de conteúdo gerado usa um `Map` tipado, armazenado em `globalThis` para sobreviver a recarregamentos de módulo em desenvolvimento, evitando chamadas repetidas à IA para o mesmo produto.
- A validação do payload de entrada e da resposta da IA é feita inteiramente em runtime, tanto no endpoint quanto no widget — a tipagem estática do TypeScript não é suficiente para garantir a forma dos dados recebidos de fontes externas.
- A geração de conteúdo usa a Responses API da OpenAI com Structured Outputs (`json_schema`, modo `strict`), garantindo que a IA responda em um formato próximo do esperado, complementado pela validação em runtime.
- Os tipos são separados por domínio: `types/product.ts` descreve o catálogo, enquanto `types/enrich-product.ts` descreve o contrato da API de enriquecimento.
- A regeneração de conteúdo é controlada por um parâmetro de query (`regenerate=true`), sem qualquer alteração no contrato do corpo da requisição.

## Melhorias futuras

- Persistir o cache em um armazenamento externo (Redis ou banco de dados), para que sobreviva a reinicializações do processo.
- Adicionar expiração (TTL) ao conteúdo cacheado.
- Cobrir os fluxos principais com testes automatizados.
- Adicionar limitação de requisições (rate limiting) ao endpoint de geração de conteúdo.
