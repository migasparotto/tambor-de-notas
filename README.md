# Tambor de Notas

App desktop de anotações rápidas para usar durante aulas e estudos. Ele captura notas numa janela pequena e, depois, envia tudo organizado ao Notion.

A interface imita o tambor de um revólver: o centro é um pomodoro, e as câmaras ao redor são as cores de nota (cada cor indica uma função: glossário, núcleo de estudo, exemplo, tarefa) e as integrações (Notion, Todoist e IA).

> Projeto em desenvolvimento — atualmente na **Etapa 0 (Fundação)**. Veja [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md).

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

## Configuração

Copie `.env.example` para `.env` se precisar de configuração local. O arquivo `.env` nunca vai para o repositório.

## Documentação

- [docs/instrucoes.md](docs/instrucoes.md): visão, decisões técnicas e regras do app
- [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md): etapas e tarefas
