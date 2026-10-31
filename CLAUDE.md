# Tambor de Notas — guia para o Claude

As regras gerais de trabalho (comandos rápidos, como trabalhar com o Marcos, commits, princípios de código, definição de pronto) ficam no `CLAUDE.md` de usuário. Aqui fica só o que é específico deste projeto.

**Leia sempre, no início de toda sessão, os dois documentos-base do projeto:**

- [docs/instrucoes.md](docs/instrucoes.md) — fonte de verdade: visão, decisões técnicas, comportamento, requisitos e domínio.
- [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md) — o backlog: ordem das etapas, sprints, tarefas e próximo passo.

Este arquivo é só um resumo. Em caso de dúvida ou conflito, valem os dois documentos acima.

## Passos extras dos comandos rápidos

- **`executar pmp bom dia`:** além dos passos gerais, abrir o app de desenvolvimento com `npm run app:dev` (em segundo plano) para o Marcos ver como está. Se o app instalado estiver aberto, avisar que os atalhos ficam com ele.

## Regras do projeto

- **Etapas:** 0 Fundação → 1 MVP → 2 Organização → 3 Integrações → 4 IA.
- **Stack:** Tauri + React + TypeScript + Tailwind CSS, desenvolvido no **Windows nativo** (não no WSL). Rust no mínimo possível.
- **Arquitetura em 4 camadas** que não se misturam: interface (`src/ui/`), regras (`src/domain/`), armazenamento (`src/storage/`), integrações (`src/integrations/`, como adaptadores — padrão Adapter). A lógica de cada sprint vai em `src/domain/`.
- **Testes:** Vitest, com fake timers para tudo que envolve tempo (ex.: pomodoro).
- Notas são arquivos `.md` locais com frontmatter; sem banco de dados.
- **IA:** nada é implementado antes da conversa de escopo no início da etapa 4.

## Armadilhas

- A simulação do `cargo update` (`--dry-run`) só lista as versões que mudam, não as dependências que passam a apontar para outra versão. Sempre conferir o diff real do `Cargo.lock` antes de aprovar uma atualização.
- O CI atual (`ci.yml`) não compila o Rust: roda só lint, formatação, testes e o build da interface. CI verde não comprova mudanças no `Cargo.lock` ou no código Rust. Até o CI ser ajustado, toda atualização de dependência do Rust precisa de `cargo check --locked` e `cargo test --locked` rodados à mão.
- O CI também não gera o instalador. Mudanças que afetam o build do Tauri (ícones, NSIS, empacotamento) só se comprovam rodando o CD.

## Comandos

`npm run app:dev` (abre o app de desenvolvimento, "DEV", com notas e configurações separadas do instalado; não usar `npm run tauri dev`) · `npm test` · `npm run lint` · `npm run format` · `npm run build`
