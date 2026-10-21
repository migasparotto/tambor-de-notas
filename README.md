# Tambor de Notas

[![CI](https://github.com/migasparotto/tambor-de-notas/actions/workflows/ci.yml/badge.svg)](https://github.com/migasparotto/tambor-de-notas/actions/workflows/ci.yml)

App desktop de anotações rápidas para usar durante aulas e estudos. Ele captura notas numa janela pequena e, depois, envia tudo organizado ao Notion.

A interface imita o tambor de um revólver: o centro é um pomodoro, e as câmaras ao redor são as cores de nota (cada cor indica uma função: glossário, núcleo de estudo, exemplo, tarefa) e as integrações (Notion, Todoist e IA).

> Projeto em desenvolvimento — atualmente na **Etapa 1 (MVP utilizável)**. As sprints S1 (janela e tambor) e S2 (pomodoro) estão concluídas. Veja [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md).

## O que já funciona

- Janela **transparente, sem bordas e sempre por cima**: aparece só o tambor, encostado na borda direita da tela e centralizado na vertical.
- O tambor ocupa **1/3 da altura da tela** (padrão em `src/domain/settings.ts`).
- Tem 7 câmaras: azul, vermelho, verde e roxo (só contorno, por enquanto), e Notion, Todoist e IA (desativadas até as suas etapas). O relógio do pomodoro fica no centro, e o botão "+" na ponta de baixo ainda não gira.
- **Pomodoro** no centro do tambor (padrão: 25 min de foco e 5 de pausa, em `src/domain/settings.ts`):
  - clique no relógio para dar play ou pausa; o quadradinho abaixo é o stop, que volta ao foco cheio;
  - o relógio fica cinza parado, branco focando, bege-rosado pausado e âmbar na pausa de descanso;
  - ao fim do foco, conta um ciclo (`×N`, ao lado do stop) e a pausa começa sozinha; ao fim da pausa, o relógio volta ao foco e espera o play;
  - no fim de cada fase, o relógio pisca por alguns segundos e o tambor fica nítido.
- O tambor fica **translúcido** quando outra janela está em foco e **nítido** quando você clica nele.

Como a janela não tem bordas, para fechar o app clique no tambor e aperte **Alt+F4**.

## Tecnologias

- [Tauri 2](https://tauri.app/) (app desktop)
- React + TypeScript
- Tailwind CSS
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

Copie `.env.example` para `.env` se precisar de configuração local. O arquivo `.env` nunca vai para o repositório.

## Documentação

- [docs/instrucoes.md](docs/instrucoes.md): visão, decisões técnicas e regras do app
- [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md): etapas e tarefas
