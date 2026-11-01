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

_Atualizado em 01/11/2026._ Etapa 0, CI, **Etapa 1 — MVP utilizável** (S1 a S4 e o polimento), CD e Dependabot concluídos. Releases publicados: [v0.1.0](https://github.com/migasparotto/tambor-de-notas/releases/tag/v0.1.0), [v0.2.0](https://github.com/migasparotto/tambor-de-notas/releases/tag/v0.2.0) (fim da S1 da Etapa 2) e [v0.3.0](https://github.com/migasparotto/tambor-de-notas/releases/tag/v0.3.0) (fim da S2). Agora: **Etapa 2 — Organização**, próxima sprint é a S3 (Outro lado do tambor).

Decisões tomadas: mockup **C1 (bolha)** com o tambor em 1/3 da altura da tela (conferido na tela); atalhos **Ctrl+Shift+Alt**, com o plugin global-shortcut aprovado; sprints internas aprovadas (ver "Sprints internas" na Etapa 1).

1. ~~S1 — Janela e tambor~~: concluída e aprovada (tambor na borda direita, transparente, sempre por cima).
2. ~~S2 — Pomodoro~~: concluída e aprovada (lógica testada em `src/domain/pomodoro.ts`, tela ligada ao tambor, CI verde).
3. ~~Remover o exemplo `src/domain/delay.ts`~~: removido.
4. ~~S3 — Notas~~: concluída e aprovada. Notas `.md` em `Documentos\Tambor de Notas\notas\` (plugin `fs` com escopo mínimo e sem apagar, salvamento atômico, OneDrive tratado, teste no disco real); painel bolha com título, expandir, recolher, fechar e arquivar; câmara tingida enchendo; salvamento ao fechar a janela. Configurações em `configuracoes.json` (tamanho do tambor e demais) e ciclos do dia em `pomodoro.json`, na pasta do app. O `+texto+` aparece como digitado; o negrito na tela vem com o editor da S4.
5. ~~S4 — Editor e atalhos~~: concluída e aprovada. ~~Biblioteca do editor~~: decidido **CodeMirror 6 com live preview feito por nós** (ver "Notas"). ~~Modo dos símbolos~~: "só dentro do trecho", em `settings.ts`. ~~Editor com live preview~~ (títulos, negrito, itálico, código, links, listas, `---`, Ctrl+B/Ctrl+I), com testes das regras de edição, ligado ao caderno e conferido no app e **aprovado pelo Marcos**. Atalhos globais (Ctrl+Shift+Alt, configuráveis, com aviso de conflito) e Esc/Ctrl+Enter no painel, aprovados em 22/10/2026.
6. ~~**Polimento do fim da Etapa 1**~~ (concluído em 23/10/2026; só falta o item 8, condicional), na ordem: ~~sobras de `.tmp`~~ (aprovado) → ~~som e animação do tambor~~ (aprovado) → ~~completar `configuracoes.json`~~ (aprovado) → ~~Esc devolve o teclado ao vídeo~~ (aprovado) → ~~atalho global com o vídeo na frente~~ (só em desenvolvimento) → ~~cliques que nem ativam o tambor~~ (aprovado) → ~~CD~~ (feito). "Ver Markdown" está feito e aprovado. Ver a lista "Polimento" abaixo.
   - Em 23/10/2026: item 6 fechado como "só acontece em desenvolvimento" (teste com o app instalado passou); item 7 feito e aprovado; item 8 não necessário (o instalador tem 1,7 MB).
7. ~~**CD — Entrega contínua**~~: concluído em 23/10/2026. Instalador por tag (release em rascunho, publicado à mão) ou à mão; app de desenvolvimento separado do instalado (`npm run app:dev`). Release [v0.1.0](https://github.com/migasparotto/tambor-de-notas/releases/tag/v0.1.0) publicado.
8. **Agora: Etapa 2 — Organização.** Sprints aprovadas em 23/10/2026 e reorganizadas em 25/10/2026 (S1 Janela → S2 Assunto → S3 Outro lado do tambor → S4 Lista e busca → S5 Backlinks → S6 Editor → S7 Abas) e pontos 1, 3 e 4 decididos (ver "Pontos em aberto da Etapa 2"). Ponto 2 fechado em 23/10/2026. ~~**S1 — Janela**~~ concluída em 24/10/2026 (ver "Janela" na Etapa 2): arrasto feito e aprovado. Painel na borda esquerda (com o "×0") e posição lembrada ao reabrir conferidos e aprovados pelo Marcos (24/10/2026). Ícone na bandeja (sem Rust) e cantos transparentes feitos e aprovados (24/10/2026); Alt+F4 decidido (fica o "Sair" da bandeja). Arrasto só depois de segurar parado feito e aprovado (24/10/2026). Versão **v0.2.0** pelo CD: CI e CD verdes, release publicado pelo Marcos em 25/10/2026, com notas de lançamento escritas à mão (o que mudou para quem usa). **Agora: S2 — Assunto** (plano aprovado em 25/10/2026; ver "Assunto"). Itens 1 a 4 feitos em 27/10/2026 (lógica com testes e a linha do assunto no painel). Roteiro do item 4 aprovado pelo Marcos em 01/11/2026 e alertas do Dependabot resolvidos (ver "Dependabot"). **S2 concluída em 01/11/2026:** `CHANGELOG.md` aprovado, CD por tag verde (o que comprovou o `tauri-action` v1 e as notas vindas do `CHANGELOG.md`) e v0.3.0 publicada. Skills de usuário `guardar-licao` e `revisar-antes-de-enviar` criadas em 01/11/2026. Testes de notas em disco real e das regras do `focus.rs` feitos em 01/11/2026 (ver "Qualidade"). Skill de usuário `release` criada em 01/11/2026. Critérios da S3 aprovados em 01/11/2026 (ver "Outro lado do tambor e cores"). **Agora: S3 — Outro lado do tambor**, passos 1 a 3 feitos em 01/11/2026 (modelo do `cores.json`, regras e `Notebook` usando as cores do arquivo); e2e feito; próximo: passo 4 (giro), com a falha de memória de 01/11/2026 em observação (ver "Qualidade"). Decidido também em 25/10/2026: sem menu de botão direito; a troca e a criação de cores vão para a nova **S3 — Outro lado do tambor** (ver "Outro lado do tambor e cores"), que saiu do "Futuro".

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

## Etapa 1 — MVP utilizável ✅

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
5. [x] Esc devolve o teclado ao vídeo. **Decidido (22/10/2026): Esc único**, ouvido pela janela do tambor inteira (não global): com o painel aberto, recolhe a nota **e** devolve o teclado à janela de antes; com o painel recolhido e o tambor em foco, só devolve. Trocar de nota sem sair: clique em outra cor ou atalho, sem atalho novo. Feito em 22/10/2026 (regra `drumKeyAction` em `src/domain/panel.ts`; devolução em `src-tauri/src/focus.rs`, com `windows-sys` 0.61 aprovada). Testado com um vídeo de verdade e aprovado pelo Marcos em 22/10/2026.
   - **Bug da nota vermelha (visto em 22/10), reproduzido e corrigido:** o painel só ouvia o Esc com o foco dentro dele, e clicar no relógio, no stop, no "+" ou numa câmara desativada tirava o foco do editor. Acontecia com qualquer cor; a ordem atalho/clique não importava e nunca havia um segundo painel. Correção: Esc ouvido pela janela inteira, e cliques no tambor não tiram o foco do editor (`onMouseDown` no tambor; botões desativados viraram `aria-disabled`, porque um `disabled` engole o clique).
   - **Investigação (22/10/2026)**, com vídeo de verdade numa cópia separada do Edge e travas (teclas e cliques só sobre as janelas de teste). Devolver à janela anterior (`SetForegroundWindow`) funciona sempre que o app está na frente: 20/20 no protótipo e **20/20 no app real** (10 por atalho, 10 por clique), com o vídeo pausando no espaço. Pelo clique, só funciona com o "observador" do Windows (`SetWinEventHook`), porque o Windows não conta a outro programa qual janela perdeu o foco (sem ele, 0/5). Alternativas medidas: minimizar 0/10 (e o tambor some); Alt+Tab simulado 10/10, mas é gambiarra; só tirar o foco do tambor não resolve.
   - **Plano B (esconder e mostrar):** com o `show()` do Tauri **não funciona**, porque ele reativa a janela e toma o teclado de volta. Funciona (3/3) se a janela for marcada antes como "não ativável" (`setFocusable(false)`), porque aí o Tauri mostra sem ativar. Fica como reserva.
   - **Cliques que nem ativam o tambor:** aprovado como tarefa separada (item 7). Com a janela "não ativável" enquanto não há painel aberto, o clique no relógio deu play e o teclado ficou no vídeo (testado); abrir uma cor precisa então tornar a janela ativável e pedir o foco (testado: funciona). Sem Rust, pela permissão `core:window:allow-set-focusable`. Prós e contras levados ao Marcos em 22/10/2026.
   - Achado à parte, sem mudança: a dica (tooltip) de uma câmara cobre a câmara de baixo, mas o clique passa através dela.
   - Inspeção do WebView2: porta 9333 (`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333`); a 9222 é do Lenovo Vantage neste notebook.
6. [x] Atalho global com o vídeo na frente (fechado em 23/10/2026: **só acontece em desenvolvimento**, ver o teste com o app instalado abaixo): o Marcos viu em 22/10/2026 que Ctrl+Shift+Alt+2 não funciona com o vídeo na frente. **Antes de programar:** investigar se o atalho chega ao app (o painel abre?), onde fica o foco do teclado, se muda entre navegador em janela normal e em tela cheia, e se o `focus.rs` pode servir para o tambor pegar o teclado de forma confiável; trazer causa e sugestão.
   - **Investigação (22/10/2026):** com o Edge de teste (vídeo de verdade, teclas só nas janelas de teste), o atalho funcionou **40/40** em janela normal, maximizada, tela cheia (F11) e vídeo em tela cheia, também com o tempo de tecla de uma pessoa e preparando o vídeo só com clique. O painel abriu, o tambor ficou visível, o teclado foi para o editor e o "Alt falso" do `setFocus` do Tauri (truque usado quando o Windows recusa) nunca apareceu.
   - **Causa provável:** no registro da sessão do Marcos, cada aperto às 21:54–21:55 gerou `[TAURI] Couldn't find callback id …`: o atalho **chegou ao app**, mas a tela já não tinha as funções de resposta dos atalhos, então nada abria. O notebook tinha voltado de uma **suspensão às 21:49** (dormia desde 20:57). Recarregar a tela (F5) **não** reproduz: ela registra os atalhos de novo e eles funcionam. Falta confirmar com um teste de suspensão.
   - **Hipótese:** os atalhos morrem depois de suspender o notebook (`Couldn't find callback id`). **Correção sugerida:** registrar os atalhos de novo ao detectar o pulo de tempo (um relógio interno que de repente atrasa minutos), com a regra em `src/domain/` e teste com tempo simulado. **Alternativa:** atalhos no Rust, que traz o tambor para a frente e avisa a tela por um evento.
   - **Teste de suspensão (noite de 22 para 23/10/2026):** o retrato das funções registradas ficou em `C:\Users\cacog\tambor-diagnostico` (fora do repositório). O notebook suspendeu às 02:27, hibernou e voltou às 10:32. **Resultado:** o atalho com o vídeo na frente **funcionou** (Marcos, 23/10). Ao acordar, a tela do app **recarregou sozinha** às 10:32:09 (tipo `reload`), as 6 funções do retrato sumiram e a tela nova registrou os atalhos de novo; os 5 avisos `Couldn't find callback id` das 10:32:10 são das funções antigas. Ontem, às 21:54, os apertos chamavam funções de uma tela que já não existia, e nenhuma tela nova as tinha substituído.
   - **Conclusão provável:** quem recarrega a tela ao acordar é o Vite (o servidor de desenvolvimento do `tauri dev`), que perde a conexão na suspensão e recarrega a página quando ela volta. No app instalado não há Vite, então essa recarga não deve acontecer. **Decidido (23/10/2026): não corrigir agora.**
   - **Teste a fazer no fim da etapa (com o app instalado, sem Vite):** abrir o app instalado, deixar o notebook dormir ou hibernar, voltar, pôr um vídeo na frente e apertar Ctrl+Shift+Alt+2. **Se o painel abrir**, fechar o item como "só acontece em desenvolvimento". **Se falhar**, investigar a correção (a ideia de "registrar de novo ao detectar o pulo de tempo" ou os atalhos no Rust, ver acima).
   - **Resultado (23/10/2026): passou.** Com o app instalado aberto desde as 12:16, o notebook dormiu das 12:17 às 13:09; na volta, Ctrl+Shift+Alt+2 com o vídeo na frente abriu o painel (Marcos). A tela **não** recarregou (mesmo início, 12:16:22, e as mesmas 6 funções de resposta de antes). Item fechado como "só acontece em desenvolvimento"; nenhuma correção necessária.
7. [x] Cliques que nem ativam o tambor (aprovado em 22/10/2026, depois do item 6): com o painel fechado, a janela fica "não ativável" (`setFocusable(false)`), e clicar no relógio, no stop ou no "+" não tira o teclado do vídeo; abrir uma cor torna a janela ativável e pede o foco. Feito em 23/10/2026 (regra `canTakeKeyboard` em `src/domain/panel.ts`, permissão `core:window:allow-set-focusable`). Barra de tarefas sem mudança.
   - **Translucidez:** o WebView2 marca a página como "em foco" ao clicar no relógio, mesmo sem a janela ser ativada, e o aviso de "perdeu o foco" nunca chegava: o tambor ficava nítido até o Esc. **Decidido (23/10/2026):** nítido só com nota aberta e em foco, ou no aviso de fim de ciclo (regra `isDrumSharp`). Testado e aprovado pelo Marcos em 23/10/2026.
8. [x] **Não necessário (23/10/2026):** o instalador do CD tem 1,7 MB. Tamanho do código do app: com o CodeMirror ele foi de 244 kB para 763 kB (257 kB comprimido), quase tudo porque o `@codemirror/lang-markdown` traz junto HTML, CSS e JavaScript. **Só se o instalador do CD ficar grande.**

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

## Depois da Etapa 1 — Entrega contínua (CD) ✅

**Objetivo:** gerar o instalador do app automaticamente, sem montar à mão.

**Pronto quando:** o GitHub Actions gera o instalador do Windows a partir do código no GitHub. Os detalhes (quando gerar, onde guardar o instalador) são decididos no início desta fase.

**Decidido (23/10/2026):**

- O instalador é gerado quando o Marcos cria uma **tag de versão** (ex.: `v0.1.0`) e fica anexado a um **release em rascunho** (draft) na página de Releases do GitHub. O Marcos confere e publica à mão.
- O workflow também pode ser **rodado à mão** (`workflow_dispatch`), para testar o CD sem criar tags de teste. Nesse caso não há release: o instalador fica nos arquivos da própria execução (artifact).
- **Só Windows** por enquanto, e só o instalador `.exe` (NSIS), que instala para o usuário, sem pedir administrador.
- **Conferência da versão:** se a tag for diferente da versão em `package.json`, `src-tauri/tauri.conf.json` ou `src-tauri/Cargo.toml`, o CD para com um erro claro.
- Sem assinatura digital por enquanto (o Windows mostra um aviso ao instalar). Atualização automática fica fora (ver "Futuro").

- [x] Decidir quando o instalador é gerado e onde ele fica
- [x] Criar o workflow do GitHub Actions que gera o instalador do Windows (`.github/workflows/cd.yml`, aprovado em 23/10/2026; verde rodado à mão)
- [x] Conferir que o instalador funciona neste notebook (23/10/2026: instalação silenciosa sem erro, em `AppData\Local\Tambor de Notas\`, com atalho no menu Iniciar; o app abre)
- [x] Ações do GitHub na v7 (Node 24) no CI e no CD, sem o aviso de Node antigo (23/10/2026)
- [x] Teste do item 6 do polimento com o app instalado (hibernar e apertar Ctrl+Shift+Alt+2 na volta): passou em 23/10/2026
- [x] Primeiro release: tag `v0.1.0`, CD verde e rascunho publicado com o `.exe` anexado (23/10/2026)
- [x] Segundo release: tag `v0.2.0` (fim da S1 da Etapa 2), CI e CD verdes e rascunho publicado com o `.exe` anexado (25/10/2026). Notas de lançamento: só o que mudou para quem usa, escritas à mão (o botão "Gerar notas de lançamento" do GitHub depende de pull requests, que o projeto não usa)
- [x] Terceiro release: tag `v0.3.0` (fim da S2 da Etapa 2), CI e CD verdes, com as notas vindas do `CHANGELOG.md`, e rascunho publicado com o `.exe` anexado (01/11/2026)

## Depois do CD — Separar o app de desenvolvimento do instalado ✅

Pedido do Marcos em 23/10/2026. Hoje o app do `tauri dev` e o instalado usam o mesmo identificador, então dividem as notas, o `configuracoes.json`, o `pomodoro.json` e os atalhos globais.

- [x] Propor como separar, aprovado pelo Marcos em 23/10/2026: configuração só para o desenvolvimento, pasta de notas de teste e os mesmos atalhos, confiando no aviso de "já está em uso"
- [x] Implementar (23/10/2026): `npm run app:dev` usa `src-tauri/tauri.dev.conf.json` (identificador `com.tambordenotas.app.dev`, nome "Tambor de Notas (Dev)"), com configurações próprias em `%APPDATA%\com.tambordenotas.app.dev` (copiadas do instalado na primeira vez); notas em `Documentos\Tambor de Notas (Dev)\notas\` (regra `notesRootFor`, com teste); marca "DEV" em âmbar acima do relógio. Conferido no app: identificador e nome certos, pastas separadas, marca visível e aviso dos atalhos ocupados pelo instalado.

## Dependabot ✅

Pedido do Marcos em 28/10/2026: manter as dependências atualizadas e receber avisos de segurança.

- [x] `.github/dependabot.yml` (28/10/2026): npm, cargo (`src-tauri`) e GitHub Actions, toda semana, um PR agrupado por tipo. Nenhuma dependência alterada agora.
- [x] Ligar no GitHub (Settings → Code security) os "Dependabot alerts" e os "Dependabot security updates" (feito pelo Marcos em 28/10/2026)
- [x] Resolver os alertas moderados que o Dependabot achou (concluído em 01/11/2026):
  - [x] **tokio**: condição de corrida em `tokio::time::Interval`; corrigido na 1.54.1 (PR #5, 31/10/2026). O alerta #2 fechou sozinho em 31/10/2026.
  - [x] **glib**: uso indevido de memória em `glib::VariantStrIter`; corrigido na 0.20.0. Alerta #1 dispensado em 01/11/2026 como "código vulnerável não usado": o glib só entra no build do Linux, e nenhuma versão do Tauri, nem a 3.0.0-alpha.5 e a branch `dev`, usa outro gtk que não o 0.18 (que traz o glib 0.18). O lembrete fica em "Exceções temporárias", no `CLAUDE.md`.
  - [x] **minimatch** (só de desenvolvimento, vem pelo ESLint): negação de serviço com padrão de busca malicioso; alerta #3 corrigido em 01/11/2026 (PR #11). A linha 10 não tem versão corrigida, então um `overrides` no `package.json` força a 11.0.3, sem mudar o ESLint. O lembrete fica em "Exceções temporárias", no `CLAUDE.md`.
- [x] PRs abertos do Dependabot resolvidos em 31/10/2026: Rust (#3), `tauri-action` v1 (#2) e npm (#8, que substituiu o #4). O caminho do CD por tag com a v1 será comprovado na própria v0.3.0.
- [x] CI compila e testa o Rust no Windows: `cargo fmt --check`, `cargo check --locked` e `cargo test --locked` (PR #9, 31/10/2026)
- [x] PR separado do TypeScript 7: até 01/11/2026 o Dependabot não abriu, provavelmente porque o `typescript-eslint` exige versão abaixo da 6.1.0 (não confirmado). Paramos de esperar por ele: o lembrete é a tarefa futura abaixo. Se ele abrir, **não juntar**.
- [x] **Na v0.3.0:** as notas de lançamento vêm do `CHANGELOG.md`, lido pelo CD com `scripts/release-notes.mjs` (com testes), em vez de serem escritas à mão no GitHub (01/11/2026).
- [ ] **Tarefa futura:** migrar para o TypeScript 7 quando o `typescript-eslint` aceitar (hoje exige versão abaixo da 6.1.0).

## Qualidade

- [x] Testes de notas em disco real, em pasta temporária, e regras do `focus.rs` separadas e testadas em Rust (PR #14, 01/11/2026). O `npm test` também roda no Windows no CI. Esc testado e aprovado pelo Marcos nos 4 casos.
- [ ] **Agora, antes da S3:** falha de memória (`0xc0000005`, em `ntdll.dll`) que derrubou o app parado em 01/11/2026: o instalado v0.3.0 às 14:52 e o DEV por volta de 15:35. Investigar antes de mudar código e mostrar a causa provável e a proposta ao Marcos; se a causa estiver na v0.3.0, a correção vira uma v0.3.1.
  - Em 01/11/2026, causa ainda desconhecida. Pela pilha, parece memória corrompida antes da queda, que aconteceu num pedido de memória do `wry`; o vigia do `focus.rs` não aparece na pilha. Sem queda em: 1.749 trocas de foco em 90 s; instalado aberto por cerca de 2h25; cópia com a consulta do cursor a 1 ms e page heap por 20 min. `wry` e `tao` são iguais na v0.2.0 e na v0.3.0. Quando a causa for descoberta, antes da correção, criar a skill de usuário `investigar-falha`.
  - **Em observação (decidido em 01/11/2026):** a S3 segue. Se o app cair de novo, ou mais de uma vez na mesma semana, a investigação volta a ser prioridade antes de continuar a S3, comparando o dump novo com o primeiro.
- [x] **Testes de ponta a ponta (e2e)** com o app real, em `e2e/` (WebdriverIO e `tauri-driver`), feitos em 01/11/2026 depois do passo 3 da S3. Como rodar: ver o README. Job `e2e` no CI, só no Windows; o driver do Edge é baixado na versão exata do WebView2. Uma execução local em cerca de 20 falhou com "Failed to create a session", sem causa conhecida: se o CI ficar instável, avisar o Marcos, e não desligar o teste.

## Etapa 2 — Organização

**Objetivo:** as notas ficam organizadas, conectadas e fáceis de achar.

**Pronto quando:** consigo personalizar as cores, definir o assunto, ligar notas com backlinks, usar toggle list e sumário, buscar notas e abrir a pasta de uma nota. Requisitos: RF06 a RF13.

**Decidido antes de programar (23/10/2026):** toggle list salva como HTML `<details><summary>Título</summary> … </details>` (ver "Pontos em aberto da Etapa 2").

### Sprints internas (aprovadas em 23/10/2026)

| Sprint | Conteúdo |
| --- | --- |
| **S1 · Janela** | Arrastar o tambor (e espelhar na borda esquerda), lembrar a posição; **por último**, o clique passando pelos cantos transparentes (se precisar de Rust ou complicar, vira item separado, sem travar o resto) |
| **S2 · Assunto** | Campo assunto com o último usado, por cor (RF07); cria o arquivo das cores `cores.json` |
| **S3 · Outro lado do tambor** | O "+" gira o tambor 180°; a câmara vazia mostra as notas ativas das cores fora do tambor e a opção de cor nova; editar nome, função e tom da cor no cabeçalho da nota (RF06). Saiu do "Futuro" em 25/10/2026 |
| **S4 · Lista e busca** | Lista de notas filtrável e busca (RF11), e abrir a pasta da nota (RF12). Monta o **índice das notas** em `src/domain/`, já pensado para os backlinks |
| **S5 · Backlinks** | `[[link]]` clicável, sugestões ao digitar e "quem aponta para esta nota" (RF08), reaproveitando o índice da S4 |
| **S6 · Editor** | Toggle list, sumário (TOC) e espaçamento (RF09, RF10, RF13) |
| **S7 · Abas** | Até 3 notas abertas como abas empilhadas; os testes incluem a regra de foco do item 7 (`canTakeKeyboard`) com várias abas |

Regras: a lista e a busca vêm antes dos backlinks porque montam o índice que os backlinks usam. **Cada sprint termina com uma versão nova** pelo CD (v0.2.0, v0.3.0...).

### Pontos em aberto da Etapa 2

**Decidido pelo Marcos (23/10/2026):**

1. **Renomear e cor da nota.** O título muda raramente; quando muda, o arquivo é renomeado e **todos os `[[links]]` que apontavam para ele são atualizados**: nada pode quebrar. A cor de uma nota nunca muda. A **câmara é só um lugar** no tambor; as notas pertencem à cor. Trocar a cor de uma câmara só muda qual cor aparece nela; quando a cor antiga volta a uma câmara, as notas dela reaparecem como estavam. No futuro haverá mais cores do que câmaras (escolhidas pelo "+"). Hoje o cabeçalho de cada nota já guarda o id da cor (`color: red`), não a câmara.
2. **Títulos repetidos em cores diferentes são notas diferentes** e nunca são juntados; a ligação entre assuntos parecidos fica para a IA (Etapa 4).
3. **Nome, função e destino ficam presos à cor**, não à câmara (confirmado pelo Claude; ver os detalhes ainda abertos abaixo).
4. **Toggle no `.md`: formato A**, HTML `<details><summary>Título</summary> … </details>`. Recolhe no GitHub, no Obsidian e na prévia do VS Code; o live preview esconde as marcas. Conferido: sem impedimento no CodeMirror nem na API do Notion (ver "Editor").

**Decidido também (23/10/2026):**

5. **Para onde o `[[link]]` aponta:** no disco, o link guarda o **nome do arquivo** (formato do Obsidian), por exemplo `[[2026-10 vermelho - Aula de Python]]`, que é sempre único. Na tela aparece só o título, com uma bolinha da cor. Ao digitar `[[`, as sugestões mostram título, cor e mês, primeiro as notas da mesma cor. Um link digitado à mão (`[[Aula de Python]]`) é resolvido pela mesma cor e, entre elas, a mais recente, e trocado pelo nome do arquivo ao sair do link; se houver dúvida, fica com sublinhado tracejado até escolher nas sugestões. Ao renomear um título, os links são atualizados em todas as notas, ativas e arquivadas.
6. **Detalhes da cor** (de acordo, para a S3): mudar o nome ou a função de uma cor vale para todas as notas dela; uma nota ativa de uma cor fora do tambor abre pelo outro lado do tambor (S3) e pela lista (S4); os atalhos Ctrl+Shift+Alt+1 a 4 abrem a câmara (o lugar), não uma cor fixa.
7. **RF12 virou "abrir a pasta da nota"** no Explorador do Windows, no lugar de "exportar em .md" (as notas já são `.md`). "Salvar uma cópia limpa" foi para o "Futuro".

### Janela ✅ (S1, concluída em 24/10/2026)

As duas tarefas mexem na janela, e lembrar a posição usa o armazenamento criado na S3 da Etapa 1.

- [x] Janela do tambor móvel: arrastar para cima ou para baixo e para a borda esquerda da tela. Na borda esquerda o tambor espelha, com a abertura virada para a borda. O app lembra a posição entre usos. Feito em 23/10/2026 (regras em `src/domain/placement.ts`, espelho em `drum.ts`, painel à direita em `panel.ts`, posição em `janela.json`); arrasto **aprovado pelo Marcos**. Painel à direita na borda esquerda (com o "×0") e posição lembrada ao reabrir conferidos e aprovados em 24/10/2026.
- [x] **Ícone na bandeja do Windows** com um menu "Sair" (no app de desenvolvimento, com o nome "Tambor de Notas (Dev)"). Pedido de 23/10/2026: ver se dá para fazer sem Rust antes de implementar. **Feito e aprovado pelo Marcos em 24/10/2026:** sem código Rust, só a opção `tray-icon` ligada no `Cargo.toml`; o ícone é criado em `src/ui/trayIcon.ts` (API em JavaScript do Tauri) e o nome vem do próprio app. O "Sair" fecha a janela pelo caminho normal, então as notas são salvas antes.
- [x] ~~**Sair com Alt+F4 com o tambor em foco**~~ **Decidido (24/10/2026): não fazer.** O Windows manda o Alt+F4 para a janela com o teclado, e o item 7 existe para o tambor nunca pegá-lo; conciliar exigiria Rust pesado (gancho no teclado do sistema). Fica o "Sair" da bandeja; com uma nota aberta, o Alt+F4 continua funcionando. Atalho global para sair: descartado por enquanto. Pedido original: sair com Alt+F4 com o tambor em foco, não só com uma nota aberta. Hoje, sem nota aberta, a janela é "não ativável" (item 7 do polimento) e o Alt+F4 não chega a ela. Conciliar sem perder o item 7 (o clique no tambor não pode tirar o teclado do vídeo); se não der, propor uma alternativa, como um atalho global para sair.
- [x] Deixar o clique passar pelos cantos transparentes da janela para o que está atrás (o vídeo). Hoje a janela é um retângulo invisível que bloqueia o clique nesses cantos. **Aprovado (23/10/2026), sem Rust:** uma regra em `src/domain/`, com teste, diz se um ponto está "em cima do tambor" (anel, botões, painel), com uma **margem pequena no contorno** para a janela não ficar alternando com o cursor bem na borda; a tela consulta a posição do cursor (`cursorPosition`) e liga ou desliga `setIgnoreCursorEvents`. A consulta roda **só quando nenhum painel está aberto e não há arrasto**, porque nesses momentos a janela inteira recebe o clique. Último item da S1.
  - Feito e aprovado pelo Marcos em 24/10/2026: regra `isOverDrum` em `src/domain/drum.ts` (tudo o que o tambor desenha cabe no círculo externo; margem `HOVER_MARGIN` de 6 px depois que o cursor entra), com testes nas duas bordas; tela em `src/ui/useClickThrough.ts`, que consulta o cursor a cada 50 ms só com o tambor sozinho (sem painel, nem recolhendo) e não solta a janela durante o arrasto. Permissão `core:window:allow-set-ignore-cursor-events`.
- [x] **Arrasto só depois de segurar parado** (pedido de 24/10/2026): hoje uma tremida de 4 px no clique já vira arrasto. O arrasto só começa se o botão ficar apertado e parado por um instante (valor em `settings.ts`, sugestão 300 ms); mexer antes disso é só um clique. Regra em `src/domain/placement.ts`, com teste de tempo simulado; sinal visual de que o tambor "pegou", se for simples. Plano a mostrar antes de implementar.
  - Plano aprovado, feito e aprovado pelo Marcos em 24/10/2026: `dragHoldMs: 300` em `settings.ts`; regra `startPress` em `placement.ts` (esperando → só clique se mexer mais que 4 px antes do tempo, para sempre naquele aperto → "pegou" depois do tempo parado → arrastando ao mover), com 7 testes de tempo simulado; ao "pegar", cursor de mão fechada e contorno claro no anel. Os botões (relógio, stop, câmaras, "+") continuam fora do arrasto (decidido).

### Várias notas abertas (ideia de 21/10/2026; confirmada na Etapa 2 em 22/10/2026, detalhes a debater no início da etapa)

- [ ] Até 3 notas abertas por vez, mostradas como **abas empilhadas** com o título de cada uma, no estilo de pastas de arquivo (a aba de trás aparece acima, só com o título; a da frente mostra a nota inteira). Serve para anotar vários contextos na mesma aula.
- Preparado na S3: a regra "uma nota ativa por cor" virou o valor `maxActiveNotesPerColor` (padrão 1) em `src/domain/settings.ts`. Falta decidir se o limite é por cor ou no total, como escolher a aba ativa e como os atalhos funcionam com abas.

### Outro lado do tambor e cores (RF06) — S3

Decidido pelo Marcos em 25/10/2026 (sem programar ainda): **sem menu de botão direito**; nada disso fica dentro da nota, para não sobrecarregar o painel, exceto a edição no cabeçalho.

- [ ] Clicar no "+" gira o tambor para o outro lado, onde há uma câmara vazia. **Giro:** igual à animação do fim do ciclo, mas de 180° em vez de 360°.
- [ ] Clicar na câmara vazia mostra **só as notas ativas das cores que estão fora do tambor** (guardadas porque a câmara trocou de cor), para continuar. Notas fechadas ou arquivadas não aparecem.
- [ ] Na mesma câmara, a opção de **adicionar uma cor nova** (nome, função e tom). A cor nova **toma o lugar de uma câmara da frente, e o Marcos escolhe qual**. Ao criar, a nota nova já abre nessa cor, com o cursor no assunto: um passo só, sem formulário com assunto e título (decidido em 01/11/2026).
- [ ] **Sem destino na S3, nem como padrão interno:** o roxo é "tarefa para o Todoist", então um padrão "Notion" estaria errado. O destino entra na Etapa 3, junto com o envio ao Notion e ao Todoist (decidido em 01/11/2026).
- [ ] **Paleta fixa de tons,** em vez de qualquer hex, escolhida para ter contraste legível com o texto do painel. "Tom repetido" passa a ser "tom da paleta já em uso" (decidido em 01/11/2026).
- [ ] **Nome de cor único,** sem diferenciar maiúsculas e minúsculas, porque o nome vai para o nome do arquivo (decidido em 01/11/2026).
- [ ] **Nenhuma cor é apagada na S3:** ela só sai do tambor, e as notas continuam dela (decidido em 01/11/2026).
- [ ] **Trocar a cor de uma câmara com a nota dela aberta:** salvar, recolher o painel, e a nota continua ativa, aparecendo no verso (decidido em 01/11/2026).
- [ ] **Nota de cor que não existe no `cores.json`:** abre mesmo assim, com uma cor neutra e um aviso. Nunca some nem é alterada (decidido em 01/11/2026, passo 3).
- [ ] **Avisos em fila:** dois avisos na mesma abertura aparecem os dois, um depois do outro (decidido em 01/11/2026).
- [ ] Os atalhos Ctrl+Shift+Alt+1 a 4 abrem a câmara (o lugar), não uma cor fixa (decidido em 01/11/2026).
- [ ] O giro fica sem animação quando o Windows pede para reduzir movimentos. O clique no "+" não tira o teclado do vídeo nem do editor.
- [ ] `cores.json` guarda nome, função, tom e câmara; ao abrir, quem já usa o app continua com as quatro cores atuais, nos mesmos lugares e com os assuntos de antes.
- [ ] Testes em disco real da cor nova, da troca de câmara e do `cores.json` quebrado. **Ordem:** modelo → regras → Notebook → (e2e) → giro → câmara vazia → cabeçalho → teste do Marcos, README e v0.4.0.
- [ ] **Editar no cabeçalho da nota aberta:** o rótulo vira "● NÚCLEO DE ESTUDO ATIVO". Clicar no texto edita o nome e a função; clicar no círculo (preenchido com a cor da nota) deixa trocar o tom da cor, **sem permitir tons já em uso**.
- [ ] **Decidido em 01/11/2026:** a nota guarda o id da cor, e o tom é só a aparência dela, então trocá-lo vale para todas as notas da cor. Mudando o nome da cor, as notas antigas mantêm o nome do arquivo, e só as novas usam o nome novo.
- [ ] Notas antigas mantêm sua cor quando a câmara muda.
- [ ] **`cores.json` quebrado não é sobrescrito** (pedido de 25/10/2026): quando o arquivo passar a guardar nome, função e tom, um arquivo quebrado deve ser movido para as sobras ou deixado intacto, com aviso ao abrir, como o `configuracoes.json`. Hoje (S2), com só o último assunto, o próximo assunto usado regrava o arquivo.

### Assunto (RF07)

- Decidido (25/10/2026): o campo fica numa **linha própria entre o cabeçalho e o título**, compacta (fonte menor e mais apagada que o título, para não parecer um segundo título). O rótulo da cor continua no cabeçalho como está.
- Decidido (25/10/2026): o "último assunto usado" é **lembrado por cor** (cada cor tem o seu), guardado no arquivo das cores **`cores.json`** na pasta do app, criado já nesta sprint.
- Plano aprovado (25/10/2026), um commit por item: (1) assunto no arquivo da nota (`subject` no cabeçalho; notas antigas abrem com o assunto vazio); (2) último assunto por cor em `cores.json` (apagar o campo não apaga a memória); (3) a nota nova nasce com o último assunto da cor, e mudar o assunto salva sozinho; (4) linha compacta no painel, Enter no assunto leva ao título; (5) teste do Marcos, CI verde, README e versão v0.3.0.

- [x] Campo assunto em cada nota (itens 1 e 4, feitos em 27/10/2026; aprovados pelo Marcos em 01/11/2026)
- [x] Preencher automaticamente com o último assunto usado, por cor, em `cores.json` (itens 2 e 3, feitos em 27/10/2026; aprovados pelo Marcos em 01/11/2026)
- [x] **Roteiro de teste do item 4**, aprovado pelo Marcos em 01/11/2026 (no app DEV; começar saindo pela bandeja e reabrindo, para carregar o código novo):
  1. Nota nova (vermelho): a linha "Assunto" é menor e mais apagada que o título; o cursor começa no título; Enter no assunto leva ao fim do título; Esc no assunto recolhe e devolve o teclado ao vídeo; Ctrl+Enter no assunto fecha a nota; com o cursor no assunto, Ctrl+Shift+Alt+P e Ctrl+Shift+Alt+1 funcionam.
  2. Outra nota da mesma cor: vem com o último assunto; trocar o assunto e conferir `subject:` pelo botão MD.
  3. Outra cor: o assunto vem vazio (cada cor lembra o seu).
  4. Reabrir o app: cada cor traz o seu último assunto; notas de antes desta versão abrem com o assunto vazio, intactas. Arquivo: `%APPDATA%\com.tambordenotas.app.dev\cores.json`.
- [x] Item 5: CI verde, README, `CHANGELOG.md` e versão v0.3.0. CD por tag verde e release publicado em 01/11/2026, com aprovação do Marcos.

### Backlinks (RF08)

- [ ] Reconhecer `[[nome da nota]]` no texto e transformar em link clicável
- [ ] Sugerir nomes de notas ao digitar `[[`
- [ ] Painel na nota com as notas que apontam para ela
- [ ] Testes de extração de backlinks

### Editor (RF09, RF10, RF13)

- [ ] Toggle list (bloco recolhível), gravada como `<details><summary>Título</summary>`, uma linha em branco, o conteúdo em Markdown, uma linha em branco e `</details>` (as linhas em branco fazem o GitHub e o Obsidian lerem o conteúdo como Markdown; o editor as põe sozinho). No live preview, as linhas `<details>`/`</details>` somem e o `<summary>` vira o título clicável do bloco. No Notion (Etapa 3), vira um bloco `toggle` com o conteúdo como filhos.
- [ ] Sumário automático (TOC) gerado pelos títulos da nota: um índice com os subtítulos (`## texto`), clicáveis para navegar pela nota (pedido em 21/10/2026)
- [ ] Ajuste de espaçamento de linhas e margens

### Lista, busca e pasta da nota (RF11, RF12)

- [ ] Lista de notas ativas e arquivadas, filtrável por cor e assunto
- [ ] Busca por texto nas notas
- [ ] Botão para abrir a pasta da nota no Explorador do Windows (RF12, decidido em 23/10/2026)

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
- Distribuir o app para outras pessoas (instalador, atualizações).
- Atualização automática do app instalado (plugin updater do Tauri, que exige assinar as atualizações). Ideia de 23/10/2026, ao decidir o CD.
- Agrupar notas por assunto como uma visão de backlinks (ideia surgida ao definir o campo assunto).
- Salvar uma cópia limpa de uma nota em outra pasta: sem o cabeçalho e com os `[[links]]` virando títulos, para compartilhar fora do app e do Notion (ideia de 23/10/2026, no lugar do antigo "exportar em .md").
