# Tambor de Notas — Etapas e Backlog

Oct 19, 2026 · @Marcos

## Como usar este backlog

O projeto tem cinco etapas, feitas em ordem: 0 Fundação, 1 MVP utilizável, 2 Organização, 3 Integrações, 4 IA. Ao fim de cada etapa o app já é usável no dia a dia.

- **Etapas são as sprints principais.** Dentro de cada uma, as tarefas são agrupadas em sprints internas curtas (sugestão: uma a duas semanas cada). A divisão das sprints internas é feita no começo de cada etapa, junto comigo.
- **Não adiantar etapas.** Funcionalidades de uma etapa futura não entram antes da hora, nem "só um pouco".
- **Os IDs de requisito** (RF01, RNF01...) vêm do documento "Tambor de Notas — Instruções do Projeto", que é a fonte das regras de comportamento.
- **Pontos em aberto** de cada etapa são decididos no início dela, antes de programar.

### Definição de pronto (vale para toda tarefa)

- Funciona como descrito nos critérios de aceite.
- Código em TypeScript estrito, sem erros de lint.
- Partes críticas com teste automatizado.
- Nenhuma chave ou dado pessoal no repositório.
- Commit no GitHub com mensagem clara.
- Eu testei e aprovei.

## Próximo passo

_Atualizado em 22/10/2026 (boa noite)._ Etapa 0 e CI concluídos. Estamos na **Etapa 1 — MVP utilizável**: S1, S2, S3 e S4 fechadas e aprovadas.

Decisões tomadas: mockup **C1 (bolha)** com o tambor em 1/3 da altura da tela (conferido na tela); atalhos **Ctrl+Shift+Alt**, com o plugin global-shortcut aprovado; sprints internas aprovadas (ver "Sprints internas" na Etapa 1).

1. ~~S1 — Janela e tambor~~: concluída e aprovada (tambor na borda direita, transparente, sempre por cima).
2. ~~S2 — Pomodoro~~: concluída e aprovada (lógica testada em `src/domain/pomodoro.ts`, tela ligada ao tambor, CI verde).
3. ~~Remover o exemplo `src/domain/delay.ts`~~: removido.
4. ~~S3 — Notas~~: concluída e aprovada. Notas `.md` em `Documentos\Tambor de Notas\notas\` (plugin `fs` com escopo mínimo e sem apagar, salvamento atômico, OneDrive tratado, teste no disco real); painel bolha com título, expandir, recolher, fechar e arquivar; câmara tingida enchendo; salvamento ao fechar a janela. Configurações em `configuracoes.json` (tamanho do tambor e demais) e ciclos do dia em `pomodoro.json`, na pasta do app. O `+texto+` aparece como digitado; o negrito na tela vem com o editor da S4.
5. ~~S4 — Editor e atalhos~~: concluída e aprovada. ~~Biblioteca do editor~~: decidido **CodeMirror 6 com live preview feito por nós** (ver "Notas"). ~~Modo dos símbolos~~: "só dentro do trecho", em `settings.ts`. ~~Editor com live preview~~ (títulos, negrito, itálico, código, links, listas, `---`, Ctrl+B/Ctrl+I), com testes das regras de edição, ligado ao caderno e conferido no app e **aprovado pelo Marcos**. Atalhos globais (Ctrl+Shift+Alt, configuráveis, com aviso de conflito) e Esc/Ctrl+Enter no painel, aprovados em 22/10/2026.
6. **Polimento do fim da Etapa 1** (em andamento), na ordem: ~~sobras de `.tmp`~~ (aprovado) → ~~som e animação do tambor~~ (aprovado) → ~~completar `configuracoes.json`~~ (aprovado) → Esc duas vezes (investigar antes) → CD. "Ver Markdown" está feito e aprovado. Ver a lista "Polimento" abaixo.
   - **Próximo:** o item 5, Esc duas vezes: primeiro investigar (incluindo o bug da nota vermelha, com o modo de inspeção do WebView2), depois propor. Atenção: a porta 9222 já é usada pelo Lenovo Vantage neste notebook; usar outra, como a 9333.
7. **CD — Entrega contínua:** depois do polimento, antes da Etapa 2.
8. **Etapa 2 — Organização**, que inclui "até 3 notas abertas" como abas.

## Etapa 0 — Fundação ✅

**Objetivo:** ambiente pronto e projeto vazio rodando, com a estrutura certa desde o início.

**Pronto quando:** um app Tauri com React + TypeScript + Tailwind abre uma janela no Windows, o código está no GitHub público e as pastas seguem as quatro camadas.

- [x] Instalar no Windows o que o Tauri exige (Node.js, Rust e dependências do sistema), com explicação de cada item
- [x] Criar o projeto Tauri com React + TypeScript + Tailwind CSS
- [x] Criar o repositório público no GitHub, com README (o que é o projeto e como rodar) e `.gitignore`
- [x] Garantir que chaves e dados pessoais nunca vão ao repositório (arquivo de exemplo de configuração, sem valores reais)
- [x] Criar a estrutura de pastas por camada: interface, regras, armazenamento, integrações
- [x] Ativar TypeScript estrito, lint e formatação automática
- [x] Configurar o primeiro teste automatizado de exemplo, para o fluxo de testes já existir

## Antes da Etapa 1 — Integração contínua (CI) ✅

**Objetivo:** a cada envio ao GitHub, uma máquina do GitHub confere sozinha se o projeto continua saudável.

**Pronto quando:** todo push e pull request roda lint, testes e build no GitHub Actions, e o resultado (✅ ou ❌) aparece no GitHub.

- [x] Criar o workflow do GitHub Actions que roda `npm run lint`, `npm test` e `npm run build` a cada push e pull request
- [x] Fazer um envio de teste e conferir o resultado na aba "Actions" do GitHub
- [x] Mostrar o selo (badge) do CI no README

O **CD** (gerar o instalador do app automaticamente) vem logo depois do polimento da Etapa 1 (ver "Depois da Etapa 1 — Entrega contínua (CD)").

## Etapa 1 — MVP utilizável

**Objetivo:** já dá para usar numa aula de verdade: abrir uma cor, anotar, fechar a nota e usar o pomodoro.

**Pronto quando:** consigo assistir uma aula com o app aberto por cima, anotar nas quatro cores, fechar as notas e encontrá-las arquivadas em .md no disco. Requisitos: RF01 a RF05.

**Decidido antes de programar:** mockup C1 (bolha): o editor nasce na câmara clicada e cresce ao lado do tambor. Atalhos globais com Ctrl+Shift+Alt.

### Sprints internas

| Sprint | Conteúdo |
| --- | --- |
| **S1 · Janela e tambor** | Janela, tambor desenhado, tamanho configurável, configurações num lugar só (limite e tamanho) |
| **S2 · Pomodoro** | Pomodoro completo |
| **S3 · Notas** | Notas em .md, nota ativa por cor, salvamento automático, arquivar, contagem e enchimento, painel bolha com campo de texto simples e botão de expandir |
| **S4 · Editor e atalhos** | Editor estilo Notion (biblioteca debatida antes) e atalhos globais |

Regras das sprints:

- Em cada sprint, a lógica fica em `src/domain/`, com testes, **antes** da tela.
- Na S3, o campo de texto simples é um componente com entrada bem definida (recebe o texto e avisa quando ele muda). Assim o editor da S4 só o substitui, sem mexer na lógica das notas nem no salvamento.
- Fim de cada sprint: CI verde, README atualizado e push.

### Janela

- [x] Janela pequena, sempre por cima das outras (S1)
- [x] Janela transparente e sem bordas: aparece só o tambor (S1)
- [x] Translúcida quando sem foco, nítida ao clicar (S1)

### Tambor

- [x] Desenhar o meio anel em arco, encostado na borda direita, com o relógio no centro e as 7 câmaras redondas ao longo do arco (S1)
- [x] Tamanho do tambor configurável, com padrão de no máximo 1/3 da altura da tela (S1: valor em `src/domain/settings.ts`; salvo em `configuracoes.json` na pasta do app, na S3)
- [x] Câmaras 2 a 5 com as cores iniciais: azul (glossário pessoal), vermelho (núcleo de estudo ativo), verde (exemplo de uso), roxo (tarefa) (S1)
- [x] Câmara sem nota só com contorno; com nota ativa, preenchida e enchendo conforme a nota se aproxima do limite (contorno feito na S1; enchimento na S3)
- [x] Câmaras 6, 7 e 8 (Notion, Todoist, IA) visíveis, mas desativadas até suas etapas (S1)
- [x] Botão "+" na ponta de baixo do arco, visível mas sem girar (o giro fica para uma versão futura) (S1)

### Limite de caracteres (só valor e contagem)

- [x] Limite de caracteres configurável (padrão 300), definido num lugar só e reaproveitado na Etapa 3 (S1)
- [x] Contagem de caracteres da nota, usada para a câmara encher (S3: `charCount` conta como uma pessoa conta, ex.: 👩🏽‍💻 = 1)
- [x] Testes da contagem e do nível de enchimento com o limite configurado (S3)

### Atalhos de teclado

- [x] Atalhos globais (funcionam com o app em segundo plano) para abrir cada cor e dar play ou pausa no pomodoro (S4: plugin global-shortcut, Ctrl+Shift+Alt+1 a 4 e P; apertado de novo com a nota aberta, recolhe)
- [x] Atalhos configuráveis, com aviso se a combinação já estiver em uso por outro programa (S4: chave `shortcuts` em `configuracoes.json`)
- [x] Esc recolhe o painel e Ctrl+Enter fecha a nota (S4)

### Pomodoro (RF02)

**Decidido na S2:** padrão de 25 min de foco e 5 de pausa, sem pausa longa. Fim do foco → conta um ciclo, aviso e a pausa começa sozinha. Fim da pausa → aviso, o relógio volta ao foco cheio e espera o play. Stop (no foco ou na pausa) volta ao foco cheio, parado.

- [x] Clicar no relógio (`88:88`) dá play ou pausa; botão pequeno de stop abaixo (S2)
- [x] Tempos de foco e pausa configuráveis (S2: valores em `src/domain/settings.ts`)
- [x] Cores do relógio: cinza parado, branco focando, bege-rosado fraco pausado, âmbar na pausa de descanso; centro do stop em vermelho fraco (S2)
- [x] Aviso simples ao fim de cada ciclo: o relógio pisca e o tambor fica nítido por alguns segundos (S2)
- [x] Contador de ciclos `×N` ao lado do stop, sempre visível, inclusive com zero (S2)
- [x] Contador de ciclos salvo entre usos e zerado a cada dia (S3: `pomodoro.json` na pasta do app)
- [x] Testes da lógica do pomodoro (S2)

Nota técnica: quando os tempos puderem mudar com o app aberto, o `usePomodoro` precisa mostrar o estado do pomodoro novo (hoje a tela mantém o último estado até o próximo clique).

### Polimento (fim da Etapa 1)

Ordem combinada em 22/10/2026. A lógica de cada item vai em `src/domain/`, com testes, antes da tela.

1. [x] Sobras de `.tmp` ao abrir o app. Elas aparecem se o app parar no meio de um salvamento, e podem ter o texto mais novo da nota. **Decidido (22/10/2026), opção A:** ao abrir, o app move as sobras para `notas/sobras/` (renomear, sem permissão de apagar). Nada se perde, e o Marcos apaga à mão quando quiser. Feito e aprovado em 22/10/2026.
2. [x] Botão "ver Markdown" no painel (botão **MD**): mostra a nota exatamente como fica no `.md`, com o cabeçalho, só para leitura. Aprovado em 22/10/2026.
3. [x] Som e animação do tambor girando no fim do ciclo, ligados ao `onPhaseEnd` do pomodoro. Som e duração em `settings.ts`, com opção de desligar. **Decidido (22/10/2026):** S1 catraca + A1 giro completo, com `cycleEndSound: "ratchet"`, `cycleEndAnimation: "spin"`, `cycleEndDurationMs: 1800` e `soundVolume: 0.6`; sem animação quando o Windows pede para reduzir movimentos. Feito em 22/10/2026 (regras em `src/domain/cycleEnd.ts`, som gerado por código). Testado num fim de ciclo de verdade e aprovado pelo Marcos em 22/10/2026.
4. [x] Completar o `configuracoes.json` ao abrir: acrescentar as configurações que faltam no arquivo, com o valor padrão, sem mexer nas que o Marcos já mudou. Assim as opções novas (como os atalhos) aparecem no arquivo. Feito em 22/10/2026 (`completeSettings` em `src/domain/settings.ts`): as novas entram no fim, valores inválidos ou desconhecidos ficam como estão, arquivo completo não é regravado e JSON quebrado fica intacto (o app abre com os padrões e um aviso). Testado no app de verdade e aprovado.
5. [ ] Esc duas vezes: o 1º Esc recolhe o painel (como hoje); o 2º Esc, com o painel já recolhido, tira o foco do tambor e devolve o teclado ao vídeo. **Antes de programar:** investigar se o Windows permite isso de forma confiável e, se não, trazer alternativas.
   - Visto uma vez em 22/10: depois de abrir várias cores por atalho e clique, o Esc não recolheu a nota vermelha; suspeita: foco do teclado fora do painel. Não se repetiu. Ao chegar neste item, conferir junto usando o modo de inspeção do WebView2 (variável `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333`): quantos painéis existem na tela, onde está o foco a cada passo, a ordem atalho → clique e clique → atalho, e se acontece com qualquer cor que fique por último.
6. [ ] Tamanho do código do app: com o CodeMirror ele foi de 244 kB para 763 kB (257 kB comprimido), quase tudo porque o `@codemirror/lang-markdown` traz junto HTML, CSS e JavaScript. **Só se o instalador do CD ficar grande.**

### Notas (RF01, RF03, RF04, RF05)

**Decidido na S3 (21/10/2026) — gravar no disco:**

- Usar o **plugin oficial `fs` do Tauri**, com permissão (scope) **só** para a pasta das notas (`ativas/` e `arquivadas/`), nada além.
- Todo acesso ao disco passa por **uma única porta (interface) em `src/storage/`**, com as operações listar, ler, salvar e arquivar. O resto do app nunca usa o plugin direto.
- Os testes usam uma **implementação em memória** dessa porta, sem tocar no disco.
- **Pasta das notas:** `Documentos\Tambor de Notas\notas\` (com `ativas/` e `arquivadas/`). O caminho de Documentos **não é fixo no código**: vem do Tauri, porque a pasta pode estar no OneDrive (neste notebook está).
- **Configurações e contadores** (ex.: ciclos do pomodoro) ficam na pasta de dados do app (AppData), não junto das notas.
- **OneDrive:** se um arquivo estiver bloqueado por um instante pela sincronização, o app tenta de novo e, se não der, mostra uma mensagem clara em vez de um erro técnico. A nota nunca se perde.
- **Salvamento atômico:** gravar primeiro num arquivo `.tmp` e depois renomear por cima do `.md`. Assim, se o app travar no meio, o `.md` antigo continua inteiro. A listagem ignora arquivos `.tmp`.
- **Menor privilégio:** o app **não** recebe permissão de apagar arquivos (`remove`). Arquivar é só renomear (mover de `ativas/` para `arquivadas/`).
- **Nome do arquivo:** tirar os caracteres que o Windows não aceita (`< > : " / \ | ? *` e outros) e tratar nomes repetidos (ex.: `nota-2.md`).
- **Acentos e emoji:** teste salvando e lendo uma nota com acentos e emoji, para garantir UTF-8.

**Decidido na S3 (21/10/2026) — título, nome do arquivo e subtítulo:**

- **Título = primeira linha do texto**, mostrada com visual de campo de título (maior, com o texto de exemplo "Título…" quando vazia). Também fica no frontmatter. No `.md`, a primeira linha é gravada como `# Título`, coerente com os `##` dos subtítulos e com o Notion.
- **Nota vazia não gera arquivo:** abrir e fechar uma cor sem escrever nada não grava nada no disco (o app não pode apagar arquivos).
- **Nome do arquivo:** `AAAA-MM cor - título.md` (ex.: `2026-10 vermelho - Aula de Python.md`). A nota nasce com o nome provisório `AAAA-MM cor - sem título.md` e é renomeada **uma vez**, ao apertar Enter na primeira linha. Se o título mudar depois, o nome é ajustado ao fechar (ou enviar) a nota. **Nunca renomear a cada tecla**, por causa do OneDrive. Nomes repetidos ganham `-2`, `-3`.
- **Subtítulo:** uma linha **inteira** no formato `+texto+` vira subtítulo. Na tela aparece em negrito e um pouco maior; no `.md` é gravada como `## texto` (legível e compatível com o Notion). Só vale para a linha inteira, para não confundir com `2+2` ou `C++`.

- [x] Clicar numa câmara de cor abre a nota ativa daquela cor ou cria uma nova
- [x] Painel do editor na cor da nota, que nasce na câmara e cresce ao lado do tambor (bolha); ao recolher ou fechar, encolhe de volta para a câmara
- [x] Botão para expandir o painel e ler ou editar a nota inteira quando ela ficar grande (S3)
**Decidido na S4 (21/10/2026) — editor:** **CodeMirror 6**, editando o próprio `.md` (sem conversão), com **live preview feito por nós**: esconde `#`, `##`, `**`, `*`; título maior com "Título…"; `+texto+` vira `## texto` ao sair da linha; atalhos Ctrl+B (negrito), Ctrl+I (itálico) e Ctrl+Z (desfazer), aprovados no protótipo. Motivo: no teste de ida e volta, só o CodeMirror devolveu o `.md` idêntico; o Tiptap escapa `[ ] * _`, troca `<` e `&` por códigos HTML e transforma `~aprox~` em riscado, e o BlockNote troca `-` por `*` e `---` por `***`. Não há pacote pronto confiável de live preview (os existentes são pequenos ou parados). Menu "/" e blocos arrastáveis ficam como bônus, para depois. BlockNote + CodeMirror juntos foi descartado (dois editores sincronizando, e a fidelidade ainda dependeria da conversão do BlockNote).

**Modo dos símbolos:** "só dentro do trecho": o `#` ou o `**` só aparece quando o cursor está dentro daquele título ou negrito. Fica em `settings.ts` (`symbolsMode`), com as opções `"element"` (padrão), `"line"` (linha atual, como o Obsidian) e `"never"`.

Teste de ida e volta do `.md` (21/10/2026), em pasta temporária fora do projeto:

| | Tiptap | BlockNote | CodeMirror 6 |
| --- | --- | --- | --- |
| `#`, `##`, acentos, emoji | ✅ | ✅ | ✅ |
| Formato atual do app (sem linhas em branco) | ❌ põe linhas em branco | ❌ põe linhas em branco e quebra linhas com `\` | ✅ idêntico |
| `[1, 2]`, `a*b`, `c_d` | ❌ `\[1, 2\]`, `a\*b`, `c\_d` | ✅ | ✅ |
| `x < y & z` | ❌ `x &lt; y &amp; z` | ✅ | ✅ |
| `~aprox~` | ❌ vira `~~aprox~~` (riscado) | ✅ | ✅ |
| Listas e `---` | ✅ | ❌ `-` → `*`, `---` → `***` | ✅ |
| Estável ao salvar de novo | ✅ depois da 1ª vez | ✅ depois da 1ª vez | ✅ sempre |

**Plano da S4 (editor):** listas, links, código e `---` no live preview; testes das regras de edição; ligar o editor ao caderno. Depois, os atalhos globais.

- [x] Editor estilo Notion (formatação aparece enquanto digito), salvando em Markdown (S4: CodeMirror 6 com live preview próprio)
- [x] Atalhos de formatação rápida em Markdown (S4: Ctrl+B, Ctrl+I, Ctrl+Z; Enter continua listas)
- [x] Título na primeira linha, com visual de campo de título e o texto de exemplo "Título…" (S3)
- [x] Subtítulo com `+texto+` na linha inteira, gravado como `## texto` (S3); em negrito e maior na tela com o editor da S4
- [x] Nome do arquivo `AAAA-MM cor - título.md`: provisório "sem título", renomeado no primeiro Enter e ajustado ao fechar (S3)
- [x] Salvamento automático em `notas/ativas/`, com metadados no cabeçalho do arquivo
- [x] Fechar a nota move o arquivo para `notas/arquivadas/` e libera a cor para uma nota nova
- [x] Testes de leitura e escrita dos arquivos .md (S3: porta de armazenamento, frontmatter e `Notebook`)

## Depois da Etapa 1 — Entrega contínua (CD)

**Objetivo:** gerar o instalador do app automaticamente, sem montar à mão.

**Pronto quando:** o GitHub Actions gera o instalador do Windows a partir do código no GitHub. Os detalhes (quando gerar, onde guardar o instalador) são decididos no início desta fase.

- [ ] Decidir quando o instalador é gerado e onde ele fica
- [ ] Criar o workflow do GitHub Actions que gera o instalador do Windows
- [ ] Conferir que o instalador funciona neste notebook

## Etapa 2 — Organização

**Objetivo:** as notas ficam organizadas, conectadas e fáceis de achar.

**Pronto quando:** consigo personalizar as cores, definir o assunto, ligar notas com backlinks, usar toggle list e sumário, buscar notas e exportar em .md. Requisitos: RF06 a RF13.

**Decidir antes de programar:** como salvar toggle list no arquivo .md.

### Janela

As duas tarefas mexem na janela, e lembrar a posição usa o armazenamento criado na S3 da Etapa 1.

- [ ] Janela do tambor móvel: arrastar para cima ou para baixo e para a borda esquerda da tela. Na borda esquerda o tambor espelha, com a abertura virada para a borda. O app lembra a posição entre usos.
- [ ] Deixar o clique passar pelos cantos transparentes da janela para o que está atrás (o vídeo). Hoje a janela é um retângulo invisível que bloqueia o clique nesses cantos.

### Várias notas abertas (ideia de 21/10/2026; confirmada na Etapa 2 em 22/10/2026, detalhes a debater no início da etapa)

- [ ] Até 3 notas abertas por vez, mostradas como **abas empilhadas** com o título de cada uma, no estilo de pastas de arquivo (a aba de trás aparece acima, só com o título; a da frente mostra a nota inteira). Serve para anotar vários contextos na mesma aula.
- Preparado na S3: a regra "uma nota ativa por cor" virou o valor `maxActiveNotesPerColor` (padrão 1) em `src/domain/settings.ts`. Falta decidir se o limite é por cor ou no total, como escolher a aba ativa e como os atalhos funcionam com abas.

### Cores (RF06)

- [ ] Editar nome e função de cada cor
- [ ] Trocar a cor de uma câmara pelo botão direito
- [ ] Alternativa: câmara "+" para criar uma cor nova e escolher qual cor em uso ela substitui
- [ ] Notas antigas mantêm sua cor quando a câmara muda

### Assunto (RF07)

- [ ] Campo assunto em cada nota
- [ ] Preencher automaticamente com o último assunto usado

### Backlinks (RF08)

- [ ] Reconhecer `[[nome da nota]]` no texto e transformar em link clicável
- [ ] Sugerir nomes de notas ao digitar `[[`
- [ ] Painel na nota com as notas que apontam para ela
- [ ] Testes de extração de backlinks

### Editor (RF09, RF10, RF13)

- [ ] Toggle list (bloco recolhível)
- [ ] Sumário automático (TOC) gerado pelos títulos da nota: um índice com os subtítulos (`## texto`), clicáveis para navegar pela nota (pedido em 21/10/2026)
- [ ] Ajuste de espaçamento de linhas e margens

### Lista, busca e exportação (RF11, RF12)

- [ ] Lista de notas ativas e arquivadas, filtrável por cor e assunto
- [ ] Busca por texto nas notas
- [ ] Exportar uma nota em .md para uma pasta escolhida

## Etapa 3 — Integrações

**Objetivo:** as notas saem do app sozinhas e chegam organizadas no Notion e no Todoist.

**Pronto quando:** fechar uma nota a envia ao destino certo, o envio automático por tamanho funciona sem me interromper, e nada se perde sem internet. Requisitos: RF14 a RF16.

**Decidir antes de programar:** forma de guardar as chaves de API; em qual projeto do Todoist as tarefas caem.

### Base das integrações

- [ ] Adaptador comum para integrações (padrão Adapter), usado por Notion e Todoist
- [ ] Guardar as chaves de API no armazenamento seguro do sistema
- [ ] Fila de envio: sem internet ou com erro, tentar de novo depois
- [ ] Ativar as câmaras 6 (Notion) e 7 (Todoist) mostrando o estado da conexão

### Notion (RF14, RF15)

- [ ] Guia passo a passo para eu criar a página privada "Tambor de Notas" e conectar a integração só a ela
- [ ] Criar o banco de dados com as colunas título, cor, assunto, data de criação e data de envio
- [ ] Orientar o bloqueio do banco de dados no Notion, para evitar edição por engano
- [ ] Enviar a nota ao fechar
- [ ] Atualizar a página quando uma nota arquivada mudar no app
- [ ] Backlinks viram links entre páginas; links para notas ainda não enviadas são resolvidos depois
- [ ] Testes das regras de envio

### Limite de tamanho e envio automático (RF14)

- [ ] Teste de desempenho do editor com notas grandes, para saber se existe limite técnico
- [ ] Usar o limite de caracteres criado na Etapa 1 (mesmo valor e mesmo lugar no código)
- [ ] Reavaliar comigo se 300 caracteres é pouco, com base no uso real das Etapas 1 e 2
- [ ] Ao fechar a nota, enviar na hora
- [ ] Com a câmara cheia (a nota chegou ao limite) e a nota aberta, enviar na primeira pausa da digitação, sem interromper
- [ ] Ao passar do limite, aviso discreto, sem interromper a digitação
- [ ] Enviar ao confirmar o aviso, ao fechar a nota ou após o tempo de inatividade configurável
- [ ] Depois do envio, esvaziar a nota local e acrescentar o que vier depois à mesma página do Notion
- [ ] Calibrar comigo o limite e o tempo de inatividade ideais

### Todoist (RF16)

- [ ] Ao fechar uma nota roxa, criar uma tarefa: título → nome, texto → descrição, assunto → etiqueta
- [ ] Notas roxas não vão ao Notion

## Etapa 4 — IA

**Objetivo:** a câmara 8 vira um assistente que ajuda durante o estudo.

**Pronto quando:** as funções de IA escolhidas no início da etapa funcionam pela câmara 8. Requisito: RF17.

**Decidir antes de programar:** o escopo da IA e o provedor (serviço e modelo). Nada de IA é implementado antes dessa conversa.

- [ ] Ideia para a conversa de escopo (22/10/2026): sugerir conexões entre notas de títulos diferentes que tratam de assuntos ligados, mostrando algo como "Este assunto agrega com o assunto X", nas notas, nos documentos e no Notion. Complementa os backlinks manuais da Etapa 2.
- [ ] Conversa de escopo comigo, partindo das ideias já levantadas: tirar dúvidas; perguntar se já existe algo escrito nas notas, no Notion ou no Todoist; editar nota arquivada por comando e atualizar o Notion; esclarecer a ideia de "pedir para a IA fazer a integração"
- [ ] Escolher o provedor de IA e guardar sua chave como as demais
- [ ] Criar o adaptador de IA no mesmo formato das outras integrações
- [ ] Ativar a câmara 8
- [ ] Quebrar em tarefas as funções escolhidas e implementá-las

## Futuro (v2+)

Ideias registradas para depois da etapa 4. Nenhuma entra antes sem ser debatida comigo.

- Gravação de áudio e transcrição.
- Animação de giro do tambor e câmaras do "outro lado" (conteúdo a definir).
- Distribuir o app para outras pessoas (instalador, atualizações).
- Agrupar notas por assunto como uma visão de backlinks (ideia surgida ao definir o campo assunto).
