# AI Process

## Ferramentas de IA utilizadas

Duas ferramentas de IA foram usadas neste projeto, com papéis distintos:

- **ChatGPT**, usado fora do repositório para planejamento: decomposição do desafio em etapas menores, revisão técnica de decisões antes de implementá-las e definição da ordem dos próximos passos.
- **Claude Code**, usado dentro do repositório para a implementação incremental: escrita e edição de código, execução de `npm run build`, leitura de arquivos existentes antes de alterá-los e revisão de diffs a cada etapa.

Nenhuma outra ferramenta de IA foi usada no desenvolvimento.

## Como a IA foi orientada

O desenvolvimento seguiu um padrão de prompts consistente ao longo de todo o projeto:

- **Divisão do desafio em partes pequenas**: cada mensagem tratava de uma única fatia do sistema (scaffold, listagem, página de produto, estrutura do widget, endpoint, validação, integração com a OpenAI, cache, regeneração, otimização de latência, fluxo n8n, documentação), nunca mais de uma ao mesmo tempo.
- **Um objetivo por etapa**, declarado explicitamente no início do prompt (por exemplo, "Vamos implementar apenas a primeira versão da API", "Revise apenas a validação do endpoint").
- **Restrições explícitas para não adiantar funcionalidades**: quase todo prompt trazia uma lista do que não deveria ser feito ainda (sem cache, sem integração com IA, sem estilização, sem bibliotecas novas, sem alterar o contrato da API), para evitar que a IA resolvesse etapas futuras antes da hora.
- **Contexto técnico fornecido antes de cada alteração**: prompts posteriores relembravam o estado atual (tipos já existentes, formato de resposta já definido, cache já implementado) para que a IA não reconstruísse decisões já tomadas.
- **Validação com `npm run build`** ao final de cada etapa, antes de considerar a tarefa concluída.
- **Revisão do diff antes de aceitar mudanças**, com pedidos explícitos para mostrar apenas os arquivos alterados e explicar as decisões tomadas.
- **Pedidos de correção específicos** sempre que um problema era identificado, apontando exatamente o que estava errado e o que deveria mudar, em vez de pedir uma reescrita genérica.

## O que foi gerado com auxílio de IA

Com auxílio do Claude Code, foram gerados:

- A estrutura inicial das funcionalidades do projeto foi implementada incrementalmente, incluindo a listagem de produtos, página de detalhes, widget de enriquecimento, endpoint da API e integração com a OpenAI.
- A estrutura inicial do `ProductAIWidget`, com estados preparados para uma integração futura antes de qualquer chamada de API existir.
- O endpoint `POST /api/enrich-product`, incluindo validação de payload e, depois, a integração real com a OpenAI.
- As funções de validação em runtime da resposta da IA, tanto no servidor quanto no cliente.
- O cache em memória por `productId`.
- O fluxo n8n foi refinado durante a montagem manual até utilizar expressões dinâmicas (`{{ $json.body.productId }}`, `{{ $json.body.productTitle }}`, `{{ $json.body.productDescription }}` e `{{ $json.body.category }}`), permitindo encaminhar ao endpoint os dados recebidos pelo Webhook em vez de valores fixos de teste.
- A documentação do projeto (`README.md` e este arquivo).

Cada trecho gerado foi revisado manualmente antes de ser aceito: o código passou por `npm run build` a cada etapa, e partes específicas (endpoint, widget, fluxo n8n) foram testadas manualmente com chamadas HTTP reais antes de seguir para a etapa seguinte.

## O que foi revisado ou corrigido manualmente

Exemplos concretos de correções feitas durante o desenvolvimento, a partir de pedidos diretos:

- A validação do corpo da requisição no endpoint foi refeita para tratar o dado recebido como `unknown` em vez de confiar em `Partial<EnrichProductRequest>`, já que a tipagem estática do TypeScript não garante nada sobre o que chega em runtime.
- Foi rejeitado o cast direto da resposta da OpenAI para o tipo esperado; em seu lugar, o conteúdo passou a ser validado por type guards antes de ser aceito ou cacheado.
- A validação de `bullets` e `faqs` foi detalhada para checar quantidade de itens e não apenas o tipo do array (2 a 3 bullets não vazios, exatamente 3 FAQs com `question`/`answer` não vazios) — primeiro no endpoint, depois replicada com o mesmo rigor no widget.
- O endpoint foi ajustado para aceitar `?regenerate=true` e ignorar o cache existente nesse caso, sem alterar o contrato do corpo da requisição.
- O modelo usado na geração de conteúdo foi trocado de `gpt-5-mini` para `gpt-5-nano` para reduzir a latência da chamada.
- Foram adicionados `reasoning: { effort: "minimal" }` e um limite de `max_output_tokens`, já que o modelo por padrão gastava tempo com raciocínio interno desnecessário para uma geração curta e estruturada.
- `fetchEnrichment`, no widget, foi movida para dentro de `useCallback` com as dependências corretas (`productId`, `productTitle`, `productDescription`, `category`), permitindo que o `useEffect` de carregamento inicial dependesse dela de forma segura.
- As instruções de montagem do fluxo n8n precisaram considerar diferenças de nomenclatura entre versões da interface (por exemplo, a opção que expõe o `statusCode` da resposta aparece como "Full Response" ou "Include Response Headers and Status", dependendo da versão instalada).
- No fluxo n8n, o mapeamento de erro precisou referenciar o node `HTTP Request` diretamente (`$('HTTP Request').item.json.statusCode`), em vez de `$json.statusCode`, porque o node de tratamento de erro já havia substituído o conteúdo de `$json` antes do `Respond to Webhook` final.

## Sugestões rejeitadas ou alteradas

- A resposta mock fixa do endpoint (`buildMockResponse`) foi tratada desde o início como temporária e explicitamente removida quando a integração real com a OpenAI foi implementada.
- Uma validação inicial no widget que verificava apenas `Array.isArray(bullets) && Array.isArray(faqs)` foi considerada insuficiente e substituída por uma validação equivalente à do servidor, com checagem de conteúdo de cada item.
- Um cache sem forma de invalidação foi identificado como incompatível com o botão "Regenerar" (o botão nunca produziria conteúdo novo) e corrigido com o parâmetro `regenerate=true`.
- A configuração inicial sugerida para o node HTTP Request do n8n (`On Error: Continue`) foi ajustada durante a montagem manual do fluxo: o arquivo exportado usa `Continue Using Error Output`, com um caminho de erro separado diretamente na saída do próprio node, diferente do desenho original.
- O fluxo n8n foi refinado durante a montagem manual até utilizar expressões dinâmicas (`{{ $json.body.productId }}`, `{{ $json.body.productTitle }}`, `{{ $json.body.productDescription }}` e `{{ $json.body.category }}`), permitindo encaminhar ao endpoint os dados recebidos pelo Webhook em vez de valores fixos de teste.

## Decisões técnicas tomadas

- **App Router** do Next.js, com rotas de página e de API convivendo na mesma árvore (`app/`).
- **Server Component** na listagem e na página de produto, lendo o catálogo diretamente do arquivo local sem necessidade de busca em cliente.
- **Client Component** restrito ao `ProductAIWidget`, único ponto da aplicação que depende de estado e efeitos de ciclo de vida.
- **Tipos separados por responsabilidade**: `types/product.ts` para o catálogo e `types/enrich-product.ts` para o contrato da API de enriquecimento.
- **Responses API** da OpenAI, em vez da API de Chat Completions, para a geração de conteúdo.
- **Structured Outputs** com `json_schema` em modo `strict`, reduzindo a chance de a IA responder fora do formato esperado, sem substituir a validação em runtime.
- **Cache global em memória**, usando um `Map` tipado guardado em `globalThis`, para sobreviver a recarregamentos de módulo em desenvolvimento.
- **Validação no servidor e no cliente**, de forma independente uma da outra — o widget não confia apenas na validação já feita pela API.
- **Tratamento de erro sem expor detalhes internos**: mensagens genéricas para o cliente, com `console.error` apenas no servidor.
- **n8n com caminho separado de sucesso e erro**, respondendo ao chamador do webhook apenas ao final do fluxo.

## Aprendizados

- A IA acelera a implementação, mas não substitui validação em runtime: quase todo problema real encontrado neste projeto vinha de assumir que um dado externo (corpo da requisição, resposta da OpenAI) tinha a forma esperada.
- Prompts menores e com um objetivo único geram resultados mais confiáveis e mais fáceis de revisar do que pedidos amplos.
- Integrar em etapas pequenas facilita detectar regressões cedo — cada mudança podia ser validada isoladamente com `npm run build` antes de seguir adiante.
- Testes manuais reais (chamadas HTTP diretas e uso da interface do n8n) revelaram problemas que o build do Next.js nunca acusaria, como ajustes necessários no mapeamento do fluxo e no tratamento dos caminhos de sucesso e erro.
- Documentação e workflow precisam ser conferidos contra o estado real do código, não contra o que se pretendia implementar; nem toda etapa planejada termina exatamente como descrita.

