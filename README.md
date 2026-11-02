# Tambor de Notas

[![CI](https://github.com/migasparotto/tambor-de-notas/actions/workflows/ci.yml/badge.svg)](https://github.com/migasparotto/tambor-de-notas/actions/workflows/ci.yml)

App desktop de anotações rápidas para usar durante aulas e estudos. Ele captura notas numa janela pequena e, depois, envia tudo organizado ao Notion.

A interface imita o tambor de um revólver: o centro é um pomodoro, e as câmaras ao redor são as cores de nota (cada cor indica uma função: glossário, núcleo de estudo, exemplo, tarefa) e as integrações (Notion, Todoist e IA).

> Projeto em desenvolvimento — a **Etapa 1 (MVP utilizável)** está concluída e o instalador do Windows está em [Releases](https://github.com/migasparotto/tambor-de-notas/releases). Atualmente na **Etapa 2 (Organização)**, com as sprints S1 (janela) e S2 (assunto) concluídas. O que mudou em cada versão está no [CHANGELOG.md](CHANGELOG.md). Veja [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md).

## O que já funciona

- Janela **transparente, sem bordas e sempre por cima**: aparece só o tambor, encostado na borda direita da tela e centralizado na vertical.
- **Arraste o tambor** pelo anel ou pelo centro (fora dos botões): segure o botão parado por um instante (0,3 s) até o anel ganhar um contorno claro e o cursor virar a mão fechada, e então mova para cima, para baixo ou para a borda esquerda. Um clique, mesmo tremido, nunca arrasta. Ele fica na borda do lado da tela onde você soltar e, na esquerda, aparece espelhado, com o painel abrindo para a direita. O app lembra onde ele ficou.
- Os **cantos vazios** da janela, fora do círculo do tambor, deixam o clique passar para o que está atrás (o vídeo).
- O tambor ocupa **1/3 da altura da tela** (padrão em `src/domain/settings.ts`).
- Tem 7 câmaras: azul, vermelho, verde e roxo (as cores de nota), e Notion, Todoist e IA (desativadas até as suas etapas). O relógio do pomodoro fica no centro, e o botão "+" na ponta de baixo ainda não gira.
- **Notas** (uma nota ativa por cor):
  - clique numa câmara de cor: o painel da nota nasce na câmara e cresce ao lado do tambor, na cor da nota;
  - o editor mostra o texto **formatado enquanto você digita** (títulos, negrito, itálico, código, links, listas, linha `---`), mas o que fica salvo é o Markdown puro; os símbolos (`#`, `**`...) só aparecem quando o cursor está dentro daquele trecho;
  - a linha **Assunto**, acima do título, guarda a matéria da nota (como "Cálculo"). Cada cor lembra o último assunto usado, e a nota nova da cor já vem com ele; Enter no assunto leva ao título;
  - a primeira linha é o **título** (maior, com "Título…"); Enter no título dá nome ao arquivo;
  - uma linha inteira `+texto+` vira subtítulo ao sair da linha (no arquivo, `## texto`);
  - **Ctrl+B** negrito, **Ctrl+I** itálico (de novo, desfaz), **Ctrl+Z** desfaz; Enter numa lista continua a lista;
  - a nota se salva sozinha 1 segundo depois que você para de digitar, e também ao fechar o app;
  - **⤢** expande o painel, **–** recolhe (a nota continua ativa) e **✓ Fechar nota** ou **Ctrl+Enter** arquiva a nota e libera a cor;
  - **Esc** (em qualquer ponto do tambor) recolhe o painel, se estiver aberto, e **devolve o teclado à janela de antes** (o vídeo), para a barra de espaço voltar a pausar o vídeo. Com o painel já recolhido, o Esc só devolve o teclado. Se aquela janela tiver sido fechada ou minimizada, nada acontece: clique no vídeo;
  - clicar no relógio, no stop ou no **+** não tira o teclado do editor;
  - **MD** mostra o texto puro da nota, exatamente como fica no arquivo `.md` (com o cabeçalho), só para leitura; clique de novo para voltar ao editor;
  - com nota ativa, a câmara fica tingida e **enche** conforme a nota se aproxima do limite de caracteres (padrão 300);
  - as notas são arquivos `.md` em `Documentos\Tambor de Notas\notas\` (`ativas\` e `arquivadas\`), com nome `AAAA-MM cor - título.md`. Funciona com Documentos no OneDrive: se a sincronização segurar um arquivo, o app tenta de novo e avisa, sem perder o texto.
  - se o app parar no meio de um salvamento, pode sobrar um arquivo `.tmp`. Ao abrir, o app move essas sobras para `notas\sobras\` (como `.md`) e avisa. Elas podem ter o texto mais novo da nota; confira e apague quando quiser.
- **Pomodoro** no centro do tambor (padrão: 25 min de foco e 5 de pausa, em `src/domain/settings.ts`):
  - clique no relógio para dar play ou pausa; o quadradinho abaixo é o stop, que volta ao foco cheio;
  - o relógio fica cinza parado, branco focando, bege-rosado pausado e âmbar na pausa de descanso;
  - ao fim do foco, conta um ciclo (`×N`, ao lado do stop) e a pausa começa sozinha; ao fim da pausa, o relógio volta ao foco e espera o play;
  - no fim de cada fase, o relógio pisca por alguns segundos e o tambor fica nítido. As câmaras dão um giro completo, desacelerando, com o som de catraca de um tambor de revólver, e param com um "clac" (1,8 s). O som é gerado pelo app, sem arquivo de áudio. Se o Windows estiver com "efeitos de animação" desligados, o tambor não gira, mas o som toca;
  - o contador `×N` mostra os ciclos **do dia**: ele volta ao reabrir o app e começa do zero num dia novo.
- O tambor fica **translúcido** quando não está em uso e **nítido** com uma nota aberta (e no aviso de fim de ciclo). Sem nota aberta, clicar no relógio, no stop ou no "+" não tira o teclado do vídeo.
- **Atalhos globais**, que funcionam mesmo com o app em segundo plano (por exemplo, com o vídeo da aula em foco):

  | Atalho           | O que faz                                       |
  | ---------------- | ----------------------------------------------- |
  | Ctrl+Shift+Alt+1 | Abre a 1ª câmara de cor, de cima (hoje, a azul) |
  | Ctrl+Shift+Alt+2 | Abre a 2ª câmara de cor (hoje, a vermelha)      |
  | Ctrl+Shift+Alt+3 | Abre a 3ª câmara de cor (hoje, a verde)         |
  | Ctrl+Shift+Alt+4 | Abre a 4ª câmara de cor (hoje, a roxa)          |
  | Ctrl+Shift+Alt+P | Play ou pausa no pomodoro                       |

  O atalho de cor traz o teclado para a nota, e você já pode digitar. Apertado de novo com a nota aberta, recolhe o painel. Se outro programa já usar uma combinação, o app avisa ao abrir. Os atalhos podem ser trocados nas configurações.

Para fechar o app, use o **ícone na bandeja** do Windows (perto do relógio): clique nele e escolha **Sair**. Com uma nota aberta, **Alt+F4** também fecha. Nos dois casos, o que estiver digitado é salvo antes de fechar.

## Tecnologias

- [Tauri 2](https://tauri.app/) (app desktop)
- React + TypeScript
- Tailwind CSS
- [CodeMirror 6](https://codemirror.net/) (editor das notas, com live preview próprio)
- Vite

## Como rodar (Windows)

### Pré-requisitos

- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) com "Desenvolvimento para desktop com C++"
- [Rust](https://www.rust-lang.org/tools/install) (via rustup)
- [Node.js](https://nodejs.org/) LTS
- WebView2 (já vem no Windows 11)

### Passos

```bash
npm install
npm run app:dev
```

A primeira execução compila as dependências em Rust e pode levar alguns minutos.

### App de desenvolvimento e app instalado

O `npm run app:dev` abre o **Tambor de Notas (Dev)**, separado do app instalado, para que os testes não mexam nas notas e nas configurações de verdade:

|                                        | App instalado                     | App de desenvolvimento (`npm run app:dev`) |
| -------------------------------------- | --------------------------------- | ------------------------------------------ |
| Notas                                  | `Documentos\Tambor de Notas\`     | `Documentos\Tambor de Notas (Dev)\`        |
| `configuracoes.json` e `pomodoro.json` | `%APPDATA%\com.tambordenotas.app` | `%APPDATA%\com.tambordenotas.app.dev`      |
| Marca no tambor                        | —                                 | "DEV" em âmbar, acima do relógio           |

Os dois usam os mesmos atalhos. Quem abrir por último avisa que eles "já estão em uso" e fica sem eles; para usar os dois ao mesmo tempo, troque os atalhos no `configuracoes.json` do app de desenvolvimento. A configuração extra do app de desenvolvimento fica em `src-tauri/tauri.dev.conf.json`. Use `npm run app:dev`, e não `npm run tauri dev`, que abriria o app de desenvolvimento com as configurações do instalado.

### Instalador (CD)

O workflow [CD](.github/workflows/cd.yml) gera o instalador do Windows (`.exe`), que não pede administrador:

- **Com uma tag de versão** (`git tag v0.1.0` e `git push origin v0.1.0`): cria um release em rascunho com o instalador anexado, para conferir e publicar à mão na página de Releases. A tag precisa bater com a versão em `package.json`, `src-tauri/tauri.conf.json` e `src-tauri/Cargo.toml`, senão o CD para com um erro. As notas do release vêm da seção da versão no [CHANGELOG.md](CHANGELOG.md), que precisa existir antes da tag.
- **À mão** (Actions → CD → Run workflow, ou `gh workflow run cd.yml`): só gera o instalador, que fica nos arquivos da execução por 7 dias.

O instalador não tem assinatura digital, então o Windows mostra "O Windows protegeu o computador": clique em "Mais informações" e "Executar assim mesmo".

### Comandos úteis

| Comando                      | O que faz                                         |
| ---------------------------- | ------------------------------------------------- |
| `npm run app:dev`            | Abre o app de desenvolvimento ("DEV")             |
| `npm test`                   | Roda os testes automatizados (Vitest)             |
| `npm run test:watch`         | Roda os testes de novo a cada arquivo salvo       |
| `npm run lint`               | Procura erros e quebras de camada (ESLint)        |
| `npm run format`             | Formata o código (Prettier)                       |
| `npm run build`              | Verifica os tipos (TypeScript) e gera a interface |
| `npm run e2e`                | Testa o app de verdade (feche o app antes)        |
| `cd src-tauri && cargo test` | Roda os testes em Rust                            |

### Testes de ponta a ponta (e2e)

Os testes em `e2e/` abrem o app de verdade e o controlam com o [WebdriverIO](https://webdriver.io/) e o driver do Edge. **Feche o Tambor de Notas** (instalado e de desenvolvimento) e rode:

```bash
npm run e2e
```

- Janelas do app abrem e fecham na tela por cerca de um minuto, e um dos testes aperta um atalho global de verdade. Evite usar o teclado nesse tempo.
- O `npm run e2e` compila um app só para os testes, com o identificador `com.tambordenotas.app.e2e`. Ele usa só `Documentos\Tambor de Notas (Dev)\notas\e2e\` e `%APPDATA%\com.tambordenotas.app.e2e`, apagadas a cada teste. Suas notas nunca são tocadas.
- O driver do Edge é baixado na hora, na versão exata do WebView2 que o app abriu, então não quebra quando o WebView2 se atualiza sozinho.
- Nada disso entra no instalador. O CI roda o e2e no Windows, no job `e2e`.

## Estrutura do código

O código em `src/` é dividido em quatro camadas que não se misturam (o ESLint bloqueia imports proibidos):

| Pasta               | Camada        | Conteúdo                               |
| ------------------- | ------------- | -------------------------------------- |
| `src/ui/`           | Interface     | O que aparece na tela (React)          |
| `src/domain/`       | Regras        | Lógica do app, sem React               |
| `src/storage/`      | Armazenamento | Leitura e escrita de arquivos no disco |
| `src/integrations/` | Integrações   | Notion, Todoist e IA, como adaptadores |

A pasta `src-tauri/` contém a parte em Rust do Tauri (janela e acesso ao sistema).

## Configuração

As configurações do app ficam em `%APPDATA%\com.tambordenotas.app\configuracoes.json` (no app de desenvolvimento, em `com.tambordenotas.app.dev`), criado com os valores padrão na primeira vez que o app abre. Cada vez que o app abre, ele acrescenta ao arquivo as configurações que faltam (por exemplo, as que chegam numa versão nova), com o valor padrão, sem mexer nas que você já mudou. Para mudar, edite o arquivo e reabra o app:

| Configuração             | Padrão      | O que é                                                                                                              |
| ------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `drumHeightFraction`     | 1/3         | Altura do tambor, como fração da altura da tela                                                                      |
| `charLimit`              | 300         | Limite de caracteres da nota (a câmara enche até ele)                                                                |
| `focusMinutes`           | 25          | Minutos de foco do pomodoro                                                                                          |
| `breakMinutes`           | 5           | Minutos de pausa do pomodoro                                                                                         |
| `autosaveDelayMs`        | 1000        | Espera, em milissegundos, para salvar depois da digitação                                                            |
| `maxActiveNotesPerColor` | 1           | Notas ativas por cor ao mesmo tempo                                                                                  |
| `symbolsMode`            | `"element"` | Quando o editor mostra `#`, `**`...: `"element"` (só dentro do trecho), `"line"` (na linha do cursor) ou `"never"`   |
| `cycleEndSound`          | `"ratchet"` | Som no fim de cada fase do pomodoro: `"ratchet"` (catraca), `"cock"` (engatilhar), `"chime"` (sino suave) ou `"off"` |
| `cycleEndAnimation`      | `"spin"`    | Animação no fim de cada fase: `"spin"` (giro completo), `"jolt"` (tranco curto) ou `"off"`                           |
| `cycleEndDurationMs`     | 1800        | Duração da catraca e do giro, em milissegundos (de 200 a 10000)                                                      |
| `soundVolume`            | 0.6         | Volume dos sons do app, de 0 (mudo) a 1                                                                              |
| `dragHoldMs`             | 300         | Tempo, em milissegundos, segurando o tambor parado até ele poder ser arrastado (de 0 a 5000)                         |
| `shortcuts`              | (abaixo)    | Atalhos globais                                                                                                      |

Os atalhos ficam assim no arquivo. Só é preciso escrever os que mudarem; os outros continuam com o padrão:

```json
"shortcuts": {
  "openColor1": "Ctrl+Shift+Alt+1",
  "openColor2": "Ctrl+Shift+Alt+2",
  "openColor3": "Ctrl+Shift+Alt+3",
  "openColor4": "Ctrl+Shift+Alt+4",
  "togglePomodoro": "Ctrl+Shift+Alt+P"
}
```

Cada atalho precisa de Ctrl, Alt ou Super (a tecla Windows), junto com uma letra, um número ou F1 a F24. Um texto vazio (`""`) desliga o atalho. Se duas ações tiverem a mesma combinação, todos os atalhos voltam ao padrão.

Um valor inválido volta ao padrão, e o app mostra um aviso ao abrir. Na mesma pasta, `pomodoro.json` guarda os ciclos do dia e `janela.json` guarda onde o tambor ficou (`"edge"`: `"right"` ou `"left"`; `"centerY"`: a altura do centro, de 0 no topo a 1 embaixo). `cores.json` guarda o último assunto usado em cada cor (por exemplo, `{ "red": { "lastSubject": "Cálculo" } }`); se ele faltar, o app abre com os assuntos vazios; se estiver quebrado, o app abre com as cores padrão, avisa e não altera o arquivo até ele ser corrigido ou apagado.

Copie `.env.example` para `.env` se precisar de configuração local. O arquivo `.env` nunca vai para o repositório.

## Documentação

- [docs/instrucoes.md](docs/instrucoes.md): visão, decisões técnicas e regras do app
- [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md): etapas e tarefas
