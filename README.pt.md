<!-- LANG-NAV -->
[English](README.md) · **Português** · [Español](README.es.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Italiano](README.it.md)

# 🪙 Trevi

> Um gestor de listas de desejos para Obsidian. Atira uma moeda à fonte e pede um desejo — cada desejo é um item guardado no teu próprio cofre. Sem funcionalidades sociais, sem IA: local, portátil e elegante.

O Trevi transforma o teu cofre numa coleção pessoal de listas de desejos. Cria listas com nome, adiciona itens com uma foto, preço e ligação, mantém um histórico de preços e vê tudo num painel SVG leve — com tudo guardado em ficheiros simples que são totalmente teus e que sincronizam trivialmente entre dispositivos, incluindo o telemóvel.

## Funcionalidades

- **Piazza** — um ecrã inicial com cada lista como um cartão (capa, número de itens, valor total).
- **Listas e itens** — CRUD completo, pesquisa de texto, filtros (estado, prioridade, etiqueta) e ordenação (preço, prioridade, data, título). Toca num item para o abrir.
- **"Atira uma moeda"** — o fluxo de adição de itens, com **captura de metadados a partir de um URL** (Open Graph + JSON-LD, obtidos através do `requestUrl` do Obsidian, para funcionar no telemóvel e contornar o CORS), e introdução manual como alternativa.
- **Imagens** — guardadas numa pasta plana, com nome por UUID e referenciadas apenas por UUID no ficheiro de dados. Adiciona a partir do teu dispositivo ou transfere a partir de um URL.
- **Preços** — atualizações apenas manuais (por item ou todos de uma vez). Cada alteração é acrescentada a um histórico de preços que alimenta os sparklines de tendência.
- **Estatísticas** — totais por moeda, contagens por estado/prioridade/etiqueta e tendências de preços. Limita o painel a todas as listas ou a apenas uma.
- **Capa da lista** — define a capa de uma lista a partir de uma imagem do dispositivo ou da foto de qualquer item.
- **Mover · Duplicar · Marcar como comprado · Abrir ligação · Exportar** — a um toque de cada item, ou a partir do menu de uma lista.
- **Exportar para Markdown** — transforma qualquer lista numa nota com uma tabela dos seus itens.
- **Lixo** — eliminação segura e recuperável com uma janela de retenção configurável; restaura ou elimina definitivamente; as imagens órfãs só são limpas quando o pedires.
- **Paleta** — a paleta serena "Trevi" mais predefinições (Travertino, Acquamarina, Notturno) e substituições por cor. A cor é aplicada apenas aos dados; tudo o resto herda o teu tema, em claro e escuro.
- **Cópias de segurança e recuperação** — escritas atómicas, um `.bak`, instantâneos diários rotativos, recuperação automática a partir da cópia de segurança legível mais recente e um modo seguro só de leitura que nunca sobrescreve dados ilegíveis.
- **Internacionalização** — English, Português, Español, Deutsch, Français, Italiano.
- **Acessível e mobile-first** — navegável por teclado, adaptável ao tema e responsivo até à largura de um telemóvel.

## Capturas de ecrã

<p align="center">
  <img src="docs/en-piazza.png" width="24%" alt="Piazza">
  <img src="docs/en-list.png" width="24%" alt="List view">
  <img src="docs/en-stats.png" width="24%" alt="Statistics">
  <img src="docs/en-modal.png" width="24%" alt="Item editor">
</p>

## Como começar

**Instalação manual**

1. Copia `main.js`, `manifest.json` e `styles.css` para `<o teu cofre>/.obsidian/plugins/trevi/`.
2. No Obsidian: Definições → Plugins da comunidade → ativa o **Trevi**.

**BRAT (beta)**

Adiciona o repositório no plugin BRAT para receber atualizações sem uma cópia manual.

**Plugins da comunidade**

Assim que estiver listado, instala-o a partir de Definições → Plugins da comunidade → Procurar.

## Utilização

1. Abre o **Trevi** a partir da faixa lateral (o ícone da fonte) ou da paleta de comandos (`Trevi: Open Piazza`).
2. Cria uma lista e depois **Atira uma moeda** para adicionar um item — cola o URL de um produto e carrega em **Obter**, ou preenche-o à mão.
3. Toca num item para o editar; usa o menu **⋯** num item para abrir a sua ligação, atualizar o preço, mover, duplicar, defini-lo como capa da lista ou eliminar.
4. Usa o menu **⋯** da lista para definir uma capa, renomear, exportar para Markdown ou eliminar.
5. Abre **Estatísticas** para ver totais e tendências de preços.

## Dados, armazenamento e privacidade

- **Fonte única de verdade**: um ficheiro JSON no teu cofre (por predefinição `core/trevi/trevi.json`), escrito de forma atómica.
- **Imagens**: uma pasta plana (por predefinição `core/trevi/assets`), um ficheiro por UUID.
- **Sem rede exceto por tua ação**: os únicos pedidos são as obtenções de metadados/preços/imagens que despoletas, todas através do `requestUrl`. Sem telemetria, sem tarefas em segundo plano, sem contas.
- **Sem IA, sem funcionalidades sociais** — sem recomendações, partilha, reservas ou ofertas.
- Ambos os caminhos são configuráveis nas Definições; alterá-los migra com segurança os teus dados existentes.

## Cópias de segurança e recuperação

- Cada gravação mantém um `.bak` e, uma vez por dia, um instantâneo datado rotativo (são mantidos os cinco mais recentes).
- No arranque, o Trevi carrega o ficheiro legível mais recente, tentando `trevi.json` → `.bak` → instantâneos diários.
- Se tudo estiver ilegível, o Trevi entra num **modo seguro só de leitura** e nunca sobrescreve os teus ficheiros, para que os possas recuperar à mão.
- Se detetar ficheiros de conflito de sincronização na pasta de dados, avisa-te.

## Definições

| Definição | O que faz |
|---|---|
| Ficheiro de dados | Caminho do JSON no teu cofre (move os dados existentes quando alterado). |
| Pasta de imagens | Onde as imagens são guardadas, por UUID (move as imagens existentes quando alterado). |
| Moeda predefinida | Código ISO 4217 usado para novos itens. |
| Idioma | Idioma da interface (6 suportados). |
| Retenção do lixo (dias) | Durante quanto tempo os itens eliminados permanecem recuperáveis. |
| Semear preço inicial | Guarda a primeira entrada de preço ao criar um item, para que as tendências tenham dados. |
| Paleta | Predefinição + substituição por cor para as cores dos gráficos. |
| Limpar imagens órfãs | Remove imagens não referenciadas — apenas quando o pedires. |

## Compatibilidade

- **Computador e telemóvel.** `isDesktopOnly` é `false`; o plugin não usa módulos Node e toda a comunicação de rede passa pelo `requestUrl`.
- Os gráficos são SVG desenhados à mão que herdam as variáveis do teu tema e funcionam em claro e escuro.

## Desenvolvimento

O Trevi é distribuído como um único `main.js` escrito à mão (mais `manifest.json` e `styles.css`) — sem necessidade de passo de compilação. A especificação funcional encontra-se em `trevi-spec.md`.

## Não-objetivos

- Sem funcionalidades sociais (partilha, reservas de presentes, amigo secreto, ofertas em dinheiro).
- Sem IA (recomendações, descoberta, geração de conteúdo).
- Sem processos em segundo plano — nada corre enquanto o Obsidian está fechado.

## Licença

[MIT](LICENSE) © Fagner Candido
