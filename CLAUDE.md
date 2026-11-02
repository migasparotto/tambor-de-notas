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
- **PRs do Dependabot:**
  - Patch (qualquer biblioteca) ou minor só de desenvolvimento, com CI verde, e com CD verde quando a atualização mexer no build: pode fazer o merge sem perguntar ao Marcos e avisar no resumo.
  - Major, minor que entra no app final, ou qualquer coisa que exija mudar código: parar e perguntar ao Marcos.
  - Atualização que entrou a mais no grupo: segue a mesma regra acima, sem precisar parar só por isso.

## Release

Detalhes deste projeto para a skill `release`:

- **Arquivos de versão:** `package.json`, `src-tauri/tauri.conf.json` e `src-tauri/Cargo.toml`, além dos lockfiles (`package-lock.json` e `src-tauri/Cargo.lock`).
- **O que o CD gera:** o instalador `.exe` (NSIS), pelo `tauri-action`, anexado a um release em rascunho.
- **Teste rápido depois de publicar:** instalar a versão publicada e conferir que o app abre, que o ícone está certo e que uma nota salva.

## Armadilhas

- Notas de lançamento: ficam no `CHANGELOG.md`, escritas antes da tag, e o CD as lê (`scripts/release-notes.mjs`). Não rodar o CD de novo numa tag em rascunho, nem editar as notas só no rascunho: o que importa fica no `CHANGELOG.md`. (Tambor, 31/10/2026)

## Exceções temporárias

- Se o app passar a ter versão para Linux, reabrir o alerta do glib. (Tambor, 01/11/2026)
- O `overrides` do `minimatch` no `package.json` força a 11.x, fora da faixa que o ESLint pede (`^10`), por causa de um alerta só corrigido na 11. Tirar quando o ESLint aceitar a 11. (Tambor, 01/11/2026)
- O `overrides` do `glob` no `package.json` força a 14.x, fora da faixa que o WebdriverIO e o Mocha pedem, por causa de um alerta só corrigido na 14.0.2. Tirar quando eles aceitarem. (Tambor, 01/11/2026)

## Comandos

`npm run app:dev` (abre o app de desenvolvimento, "DEV", com notas e configurações separadas do instalado; não usar `npm run tauri dev`) · `npm test` · `npm run e2e` (o app de verdade; fechar o app antes) · `npm run lint` · `npm run format` · `npm run build`
