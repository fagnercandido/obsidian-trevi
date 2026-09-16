# Trevi — Especificação do Plugin para Obsidian

> Um gerenciador de listas de desejos para o Obsidian. Você joga uma moeda na fonte e faz um pedido: cada desejo é um item guardado no seu cofre. Sem redes sociais, sem IA — local, portátil e elegante.

Este documento é a especificação funcional completa. Use-o como base para implementar o plugin em TypeScript, seguindo a API oficial do Obsidian.

---

## 1. Objetivo

Criar um plugin do Obsidian que reproduza a experiência dos aplicativos de lista de desejos do mercado (várias listas nomeadas, itens com foto, preço e link, busca e organização), mas com os dados no próprio cofre, funcionando também no celular e com um modelo simples de sincronizar entre dispositivos.

## 2. Não-objetivos (restrições explícitas)

- **Sem funções sociais**: nada de compartilhamento por link, reserva de presentes, amigo secreto ou presentes em dinheiro. É um cofre pessoal de um único usuário.
- **Sem IA**: nada de recomendações, descoberta automática ou geração de conteúdo.
- **Sem processos em segundo plano**: nada roda com o Obsidian fechado; toda atualização é acionada pelo usuário.

## 3. Identidade e metáfora

A metáfora da Fontana di Trevi é uma camada leve sobre uma interface sempre clara e funcional.

| Elemento | Conceito | Significado |
|---|---|---|
| **Trevi** | O plugin | A fonte onde se fazem os pedidos |
| **Piazza** | Tela inicial | A praça diante da fonte, com todas as suas listas |
| **Lançar uma moeda** | Adicionar um item | Cada desejo é uma moeda atirada à fonte |

- Ícone sugerido: uma fonte com moedas.
- A camada temática nunca deve prejudicar a clareza; rótulos funcionais permanecem legíveis.

## 4. Premissas técnicas

- Plugin do Obsidian em **TypeScript**, empacotado no padrão da comunidade.
- **Compatível com celular**: usar apenas APIs suportadas no mobile. Toda a rede passa por `requestUrl` do Obsidian (contorna CORS e funciona no celular); nada de módulos do Node.
- **Fonte de verdade única**: um arquivo JSON no cofre.
- **Imagens** em uma pasta plana, cada arquivo nomeado por um UUID.
- Renderização de gráficos leve (SVG), herdando as variáveis de tema do Obsidian.

---

## 5. Modelo de dados (JSON)

Todo o estado vive em um único arquivo (por exemplo, `Trevi/trevi.json`). Estrutura de topo: `version` e `lists[]`.

```json
{
  "version": 1,
  "settings": {
    "defaultCurrency": "EUR",
    "imagesFolder": "Trevi/assets",
    "language": "pt",
    "trashRetentionDays": 14
  },
  "lists": [
    {
      "id": "5f2b1c9a-8e4d-4a7f-9b2c-1d3e4f5a6b7c",
      "name": "Setup do escritório",
      "cover": "a1c2e3f4-5b6d-7e8f-9a0b-1c2d3e4f5a6b",
      "createdAt": "2026-09-14T10:00:00Z",
      "updatedAt": "2026-09-14T10:30:00Z",
      "items": [
        {
          "id": "b2d3f4a5-6c7e-8f9a-0b1c-2d3e4f5a6b7c",
          "title": "Cadeira ergonômica",
          "url": "https://loja.exemplo.com/cadeira",
          "price": 349.90,
          "currency": "EUR",
          "image": "c3e4a5b6-7d8f-9a0b-1c2d-3e4f5a6b7c8d",
          "priority": "alta",
          "status": "desejado",
          "tags": ["ergonomia", "home office"],
          "notes": "Modelo com apoio lombar ajustável.",
          "priceHistory": [
            { "date": "2026-09-01T00:00:00Z", "price": 379.00 },
            { "date": "2026-09-14T00:00:00Z", "price": 349.90 }
          ],
          "createdAt": "2026-09-14T10:05:00Z",
          "updatedAt": "2026-09-14T10:20:00Z"
        }
      ]
    }
  ]
}
```

### 5.1 Campos da lista

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador imutável da lista |
| `name` | string | Nome editável, definido pelo usuário |
| `cover` | UUID \| "" | Imagem de capa (referência por UUID) ou vazio |
| `createdAt` | ISO 8601 | Data de criação |
| `updatedAt` | ISO 8601 | Data da última modificação |
| `items` | Item[] | Itens da lista |

### 5.2 Campos do item

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador imutável do item |
| `title` | string | Nome do item |
| `url` | string | Link de origem (opcional) |
| `price` | number | Preço atual |
| `currency` | string | Código ISO 4217 (ex.: EUR, BRL) |
| `image` | UUID \| "" | Foto do item (referência por UUID) ou vazio |
| `priority` | enum | `alta` \| `media` \| `baixa` |
| `status` | enum | `desejado` \| `comprado` \| `arquivado` |
| `tags` | string[] | Etiquetas livres |
| `notes` | string | Observações |
| `priceHistory` | {date, price}[] | Histórico de preço no tempo |
| `createdAt` | ISO 8601 | Data de criação |
| `updatedAt` | ISO 8601 | Data da última modificação |

## 6. Armazenamento e imagens

- **Dados**: um único JSON, gravado de forma atômica para evitar corrupção.
- **Imagens**: uma pasta plana (por padrão `Trevi/assets`; alternativa `images`), com capas de lista e fotos de item juntas.
- Cada imagem é salva como `<uuid>.<extensão>` e referenciada no JSON apenas pelo UUID.
- O UUID é gerado no momento em que a imagem entra (escolhida pelo usuário ou obtida por URL).
- Motivo do desenho: um JSON mais uma pasta plana de imagens sincronizam de forma trivial entre dispositivos, com poucos conflitos.

---

## 7. Navegação e interface

### 7.1 Piazza (tela inicial)

- Grade com todas as listas; cada cartão exibe capa, nome, número de itens e valor total.
- Ações: criar lista e abrir lista.

### 7.2 Vista de lista

- Itens em cartões: imagem, título, preço, prioridade e estado.
- Busca por texto, filtro (estado, prioridade, etiqueta) e ordenação (preço, prioridade, data).
- Ações: adicionar, editar e excluir item. O botão de adicionar aparece como "Lançar uma moeda".

### 7.3 Modal de item

- Campo de URL que dispara o preenchimento por metadados.
- Campos: título, preço, moeda, imagem (escolher/substituir, salva com novo UUID), prioridade, estado, etiquetas e notas.

### 7.4 Integração com o Obsidian

- Ícone na barra lateral e comandos na paleta de comandos (abrir Piazza, nova lista, adicionar item por URL, adicionar item manualmente, atualizar preços, abrir estatísticas).

## 8. Gerenciamento (criar, editar, excluir)

- **CRUD completo** para listas e itens: nomear e renomear listas, editar todos os campos dos itens.
- **Exclusão segura e recuperável**: excluir uma lista remove seus itens e as imagens que ficariam órfãs. Toda exclusão é confirmada e reversível — os itens vão para uma lixeira com retenção configurável antes de qualquer remoção física, com opção de restaurar.
- Editar qualquer entidade atualiza sua data de modificação.

## 9. Adicionar item por URL (captura de metadados)

- Buscar o HTML da página com `requestUrl` e ler, nesta ordem de preferência:
  1. **Open Graph**: `og:title`, `og:image`, e preço em `product:price:amount` ou `og:price:amount`.
  2. **JSON-LD** (schema.org `Product`): nome, imagem e `offers.price`.
  3. **Entrada manual** como último recurso.
- A imagem obtida é baixada, recebe um UUID e vai para a pasta de imagens.
- Muitos varejistas bloqueiam ou omitem metadados; por isso a entrada manual está sempre disponível.
- Extensibilidade futura (opcional): extratores por domínio (adaptadores específicos por loja).

## 10. Preços

- Atualização **somente manual**, em duas formas:
  - **Geral**: "atualizar todos os preços".
  - **Individual**: "atualizar este item".
- Cada atualização, quando há mudança de valor, acrescenta uma entrada ao `priceHistory` (data e preço).
- Sem qualquer verificação automática ou em segundo plano.

## 11. Estatísticas

- Valor total por lista e valor global.
- Contagens por estado, prioridade e etiqueta.
- Oscilação de preço ao longo do tempo (linhas e sparklines), a partir do `priceHistory`.
- Painel no espírito de um dashboard de coleção: KPIs no topo, gráficos abaixo. Sem IA.

---

## 12. Cores dos gráficos

Princípio: deixar os gráficos respirarem. Cor apenas nos dados; fundo, eixos, grade e texto herdados do tema do Obsidian (`--background-primary`, `--text-normal`, `--text-muted`, `--background-modifier-border`), para ficarem naturais em modo claro e escuro.

### 12.1 Paleta "Trevi" (categórica)

Seis tons harmônicos, de saturação contida.

| Nome | Hex | Referência |
|---|---|---|
| Água | `#4F9D94` | Aquamarine — cor-assinatura |
| Latão | `#BFA25A` | Moeda envelhecida |
| Terracota | `#C06B4E` | Barro romano |
| Noite | `#4A6B82` | Azul ardósia |
| Louro | `#8FA27E` | Verde-sálvia discreto |
| Mármore | `#9B8AA0` | Violeta acinzentado |

### 12.2 Escalas

- **Tendência de preço** (sequencial, monocromática na água): `#DCEBE9 → #A9D0CB → #7BB8B0 → #4F9D94 → #2E7A72 → #1C5A54`.
- **Variação de preço** (divergente e calma, sem vermelho de alarme): Terracota (subiu) ↔ Mármore neutro ↔ Água (desceu).

### 12.3 Mapeamento semântico

| Dimensão | Valor | Cor |
|---|---|---|
| Estado | desejado | Água |
| Estado | comprado | Latão |
| Estado | arquivado | Mármore |
| Prioridade | alta | Terracota |
| Prioridade | média | Latão |
| Prioridade | baixa | Noite |
| Preço | desceu | Água |
| Preço | subiu | Terracota |

### 12.4 Leveza e modo escuro

- Traços finos (linhas ~1,5px), preenchimentos de área com baixa opacidade (12–18%), grade sutil, sem molduras pesadas.
- Sparklines de uma só cor, sem eixos.
- Variante ajustada para o modo escuro (tons ligeiramente mais claros e menos saturados) para não "brilhar".

### 12.5 Personalização e acessibilidade

- **Trevi** vem como paleta padrão. Nas configurações: presets curados (por exemplo, "Travertino" quente, "Acquamarina" frio, "Notturno" para escuro) e a opção de sobrescrever cada cor semântica.
- Nunca depender só da cor: usar rótulos e a direção nas sparklines. O par água/terracota é distinguível na maioria dos daltonismos.

---

## 13. Internacionalização (i18n)

- Cada nova string deve ser traduzida em todos os locais definidos no mesmo commit, sem fallbacks de "tradução ausente" em produção.
- As traduções são responsabilidade do desenvolvimento do plugin, não de pipelines externos.

## 14. Configurações

- Caminho do arquivo de dados.
- Pasta de imagens (`assets` ou `images`).
- Moeda padrão.
- Idioma.
- Retenção da lixeira (em dias).
- Comportamento da atualização de preços.

---

## 15. Critérios de aceitação

- [ ] Criar, renomear e excluir listas; criar, editar e excluir itens.
- [ ] Piazza lista todas as listas com capa, contagem e valor total.
- [ ] Cada lista e cada item têm UUID; imagens salvas por UUID em pasta plana.
- [ ] Dados persistidos em um único JSON, com gravação atômica.
- [ ] Excluir é sempre confirmado e recuperável via lixeira com retenção.
- [ ] Adicionar por URL preenche título, preço e imagem via Open Graph/JSON-LD, com recurso manual.
- [ ] Atualização de preços manual, geral e individual, alimentando o `priceHistory`.
- [ ] Estatísticas com valores totais, contagens e oscilação de preço.
- [ ] Gráficos herdam o tema; paleta Trevi aplicada só aos dados; funciona em claro e escuro.
- [ ] Tudo funciona no celular (sem dependências do Node; rede via `requestUrl`).
- [ ] i18n completa, sem strings sem tradução.

---

## 16. Resumo

**Trevi** é um plugin de lista de desejos para o Obsidian, sem funções sociais e sem IA, com todos os dados em um único arquivo JSON e as imagens em uma pasta plana nomeadas por UUID — um modelo simples de sincronizar entre dispositivos. A interface tem uma Piazza inicial com listas nomeáveis e, dentro de cada uma, os itens, com CRUD completo e exclusão segura e recuperável. A captura por URL preenche título, preço e imagem via Open Graph e JSON-LD, com entrada manual como recurso. Os preços são atualizados manualmente (geral ou individual), alimentando um histórico que abastece as estatísticas. Os gráficos são leves e elegantes: herdam o tema e recebem a paleta Trevi apenas nos dados, com variante para o modo escuro e atenção à acessibilidade.
