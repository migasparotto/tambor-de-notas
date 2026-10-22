# Tambor de Notas

[![CI](https://github.com/migasparotto/tambor-de-notas/actions/workflows/ci.yml/badge.svg)](https://github.com/migasparotto/tambor-de-notas/actions/workflows/ci.yml)

App desktop de anotações rápidas para usar durante aulas e estudos. Ele captura notas numa janela pequena e, depois, envia tudo organizado ao Notion.

A interface imita o tambor de um revólver: o centro é um pomodoro, e as câmaras ao redor são as cores de nota (cada cor indica uma função: glossário, núcleo de estudo, exemplo, tarefa) e as integrações (Notion, Todoist e IA).

> Projeto em desenvolvimento — atualmente na **Etapa 1 (MVP utilizável)**. As sprints S1 (janela e tambor), S2 (pomodoro), S3 (notas) e S4 (editor e atalhos) estão concluídas. Veja [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md).

## O que já funciona

- Janela **transparente, sem bordas e sempre por cima**: aparece só o tambor, encostado na borda direita da tela e centralizado na vertical.
- O tambor ocupa **1/3 da altura da tela** (padrão em `src/domain/settings.ts`).
- Tem 7 câmaras: azul, vermelho, verde e roxo (as cores de nota), e Notion, Todoist e IA (desativadas até as suas etapas). O relógio do pomodoro fica no centro, e o botão "+" na ponta de baixo ainda não gira.
- **Notas** (uma nota ativa por cor):
  - clique numa câmara de cor: o painel da nota nasce na câmara e cresce ao lado do tambor, na cor da nota;
  - o editor mostra o texto **formatado enquanto você digita** (títulos, negrito, itálico, código, links, listas, linha `---`), mas o que fica salvo é o Markdown puro; os símbolos (`#`, `**`...) só aparecem quando o cursor está dentro daquele trecho;
  - a primeira linha é o **título** (maior, com "Título…"); Enter no título dá nome ao arquivo;
  - uma linha inteira `+texto+` vira subtítulo ao sair da linha (no arquivo, `## texto`);
  - **Ctrl+B** negrito, **Ctrl+I** itálico (de novo, desfaz), **Ctrl+Z** desfaz; Enter numa lista continua a lista;
  - a nota se salva sozinha 1 segundo depois que você para de digitar, e também ao fechar o app;
  - **⤢** expande o painel, **–** ou **Esc** recolhe (a nota continua ativa) e **✓ Fechar nota** ou **Ctrl+Enter** arquiva a nota e libera a cor;
  - com nota ativa, a câmara fica tingida e **enche** conforme a nota se aproxima do limite de caracteres (padrão 300);
  - as notas são arquivos `.md` em `Documentos\Tambor de Notas\notas\` (`ativas\` e `arquivadas\`), com nome `AAAA-MM cor - título.md`. Funciona com Documentos no OneDrive: se a sincronização segurar um arquivo, o app tenta de novo e avisa, sem perder o texto.
- **Pomodoro** no centro do tambor (padrão: 25 min de foco e 5 de pausa, em `src/domain/settings.ts`):
  - clique no relógio para dar play ou pausa; o quadradinho abaixo é o stop, que volta ao foco cheio;
  - o relógio fica cinza parado, branco focando, bege-rosado pausado e âmbar na pausa de descanso;
  - ao fim do foco, conta um ciclo (`×N`, ao lado do stop) e a pausa começa sozinha; ao fim da pausa, o relógio volta ao foco e espera o play;
  - no fim de cada fase, o relógio pisca por alguns segundos e o tambor fica nítido;
  - o contador `×N` mostra os ciclos **do dia**: ele volta ao reabrir o app e começa do zero num dia novo.
- O tambor fica **translúcido** quando outra janela está em foco e **nítido** quando você clica nele.
- **Atalhos globais**, que funcionam mesmo com o app em segundo plano (por exemplo, com o vídeo da aula em foco):

  | Atalho           | O que faz                                      |
  | ---------------- | ---------------------------------------------- |
  | Ctrl+Shift+Alt+1 | Abre a nota azul (a 1ª câmara de cor, de cima) |
  | Ctrl+Shift+Alt+2 | Abre a nota vermelha                           |
  | Ctrl+Shift+Alt+3 | Abre a nota verde                              |
  | Ctrl+Shift+Alt+4 | Abre a nota roxa                               |
  | Ctrl+Shift+Alt+P | Play ou pausa no pomodoro                      |

  O atalho de cor traz o teclado para a nota, e você já pode digitar. Apertado de novo com a nota aberta, recolhe o painel. Se outro programa já usar uma combinação, o app avisa ao abrir. Os atalhos podem ser trocados nas configurações.

Como a janela não tem bordas, para fechar o app clique no tambor e aperte **Alt+F4**. O que estiver digitado é salvo antes de fechar.

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
npm run tauri dev
```

A primeira execução compila as dependências em Rust e pode levar alguns minutos.

### Comandos úteis

| Comando              | O que faz                                         |
| -------------------- | ------------------------------------------------- |
| `npm run tauri dev`  | Abre o app em modo de desenvolvimento             |
| `npm test`           | Roda os testes automatizados (Vitest)             |
| `npm run test:watch` | Roda os testes de novo a cada arquivo salvo       |
| `npm run lint`       | Procura erros e quebras de camada (ESLint)        |
| `npm run format`     | Formata o código (Prettier)                       |
| `npm run build`      | Verifica os tipos (TypeScript) e gera a interface |

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

As configurações do app ficam em `%APPDATA%\com.tambordenotas.app\configuracoes.json`, criado com os valores padrão na primeira vez que o app abre. Para mudar, edite o arquivo e reabra o app:

| Configuração             | Padrão      | O que é                                                                                                            |
| ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `drumHeightFraction`     | 1/3         | Altura do tambor, como fração da altura da tela                                                                    |
| `charLimit`              | 300         | Limite de caracteres da nota (a câmara enche até ele)                                                              |
| `focusMinutes`           | 25          | Minutos de foco do pomodoro                                                                                        |
| `breakMinutes`           | 5           | Minutos de pausa do pomodoro                                                                                       |
| `autosaveDelayMs`        | 1000        | Espera, em milissegundos, para salvar depois da digitação                                                          |
| `maxActiveNotesPerColor` | 1           | Notas ativas por cor ao mesmo tempo                                                                                |
| `symbolsMode`            | `"element"` | Quando o editor mostra `#`, `**`...: `"element"` (só dentro do trecho), `"line"` (na linha do cursor) ou `"never"` |
| `shortcuts`              | (abaixo)    | Atalhos globais                                                                                                    |

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

Um valor inválido volta ao padrão, e o app mostra um aviso ao abrir. Na mesma pasta, `pomodoro.json` guarda os ciclos do dia.

Copie `.env.example` para `.env` se precisar de configuração local. O arquivo `.env` nunca vai para o repositório.

## Documentação

- [docs/instrucoes.md](docs/instrucoes.md): visão, decisões técnicas e regras do app
- [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md): etapas e tarefas
