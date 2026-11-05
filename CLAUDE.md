# Tambor de Notas — guia para o Claude

As regras gerais de trabalho (comandos rápidos, como trabalhar com o usuário, commits, princípios de código, definição de pronto) ficam no `CLAUDE.md` de usuário. Aqui fica só o que é específico deste projeto.

**Leia sempre, no início de toda sessão, os dois documentos-base do projeto:**

- [docs/instrucoes.md](docs/instrucoes.md) — fonte de verdade: visão, decisões técnicas, comportamento, requisitos e domínio.
- [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md) — o backlog: ordem das etapas, sprints, tarefas e próximo passo.

Este arquivo é só um resumo. Em caso de dúvida ou conflito, valem os dois documentos acima.

## Passos extras dos comandos rápidos

- **`executar pmp bom dia`:** além dos passos gerais, abrir o app de desenvolvimento com `npm run app:dev` (em segundo plano) para o usuário ver como está. Se o app instalado estiver aberto, avisar que os atalhos ficam com ele.

## Regras do projeto

- **Nome pessoal:** em textos do repositório (docs, README, CHANGELOG, commits, PRs, comentários), nunca usar o nome do usuário; escrever sempre "o usuário". O repositório é público.
- **Etapas:** 0 Fundação → 1 MVP → 2 Organização → 3 Integrações → 4 IA.
- **Stack:** Tauri + React + TypeScript + Tailwind CSS, desenvolvido no **Windows nativo** (não no WSL). Rust no mínimo possível.
- **Arquitetura em 4 camadas** que não se misturam: interface (`src/ui/`), regras (`src/domain/`), armazenamento (`src/storage/`), integrações (`src/integrations/`, como adaptadores — padrão Adapter). A lógica de cada sprint vai em `src/domain/`.
- **Testes:** Vitest, com fake timers para tudo que envolve tempo (ex.: pomodoro).
- Notas são arquivos `.md` locais com frontmatter; sem banco de dados.
- **IA:** nada é implementado antes da conversa de escopo no início da etapa 4.
- **Autonomia (merge sozinho):** vale a política do `CLAUDE.md` de usuário. Neste projeto:
  - "CI e e2e verdes" são os jobs `check`, `rust` e `e2e` do `ci.yml`, no commit exato do merge. O e2e roda só no CI (decidido em 02/11/2026).
  - "Permissões ou capabilities" são `src-tauri/capabilities/` e os plugins do Tauri; "formato dos arquivos" é o frontmatter das notas e os `.json` da pasta do app (`configuracoes.json`, `cores.json`, `pomodoro.json`, `janela.json`): mexer neles sempre para e pergunta.
  - **A main é protegida no GitHub** (ruleset "Proteção da main", ligado pelo usuário em 02/11/2026, sem exceções): só entra por PR, com os checks `check`, `rust` e `e2e` verdes; force push e exclusão bloqueados. Nunca usar `gh pr merge --admin`, que passa por cima da proteção.
- **PRs do Dependabot:** (exceção mais permissiva à política de autonomia, porque nelas a dependência atualizada é o próprio objetivo)
  - **Automático (decidido em 04/11/2026):** patch (qualquer biblioteca) e minor só de desenvolvimento vêm nos grupos `-auto` do `.github/dependabot.yml`, e o workflow `dependabot-auto-merge.yml` liga o auto-merge: o GitHub faz o merge sozinho com os checks verdes. Ninguém precisa atualizar a branch. Como esse merge não dispara o CI na main, ela é conferida pelo CI agendado de toda terça; no "pmp bom dia", conferir que ele está verde.
  - **Minor que entra no app final** (npm de produção, Rust) e minor das GitHub Actions: um PR semanal por ecossistema (grupos `-minor`), que o usuário aprova.
  - **Major, ou qualquer coisa que exija mudar código:** PR separado; parar e perguntar ao usuário.
  - Atualização de segurança fora de grupo, ou PR `-auto` com o CI vermelho: parar e avisar o usuário.

## Release

Detalhes deste projeto para a skill `release`:

- **Arquivos de versão:** `package.json`, `src-tauri/tauri.conf.json` e `src-tauri/Cargo.toml`, além dos lockfiles (`package-lock.json` e `src-tauri/Cargo.lock`).
- **O que o CD gera:** o instalador `.exe` (NSIS), pelo `tauri-action`, anexado a um release em rascunho, e o `tambor_de_notas.pdb` conferido contra o `.exe` e anexado ao mesmo release (e como artifact `simbolos-pdb`). Conferir no rascunho que os dois estão lá.
- **Teste rápido depois de publicar:** instalar a versão publicada e conferir que o app abre, que o ícone está certo e que uma nota salva.

## Armadilhas

- Notas de lançamento: ficam no `CHANGELOG.md`, escritas antes da tag, e o CD as lê (`scripts/release-notes.mjs`). Não rodar o CD de novo numa tag em rascunho, nem editar as notas só no rascunho: o que importa fica no `CHANGELOG.md`. (Tambor, 31/10/2026)

## Exceções temporárias

- Se o app passar a ter versão para Linux, reabrir o alerta do glib. (Tambor, 01/11/2026)
- O `overrides` do `minimatch` no `package.json` força a 11.x, fora da faixa que o ESLint pede (`^10`), por causa de um alerta só corrigido na 11. Tirar quando o ESLint aceitar a 11. (Tambor, 01/11/2026)
- O `overrides` do `glob` no `package.json` força a 14.x, fora da faixa que o WebdriverIO e o Mocha pedem, por causa de um alerta só corrigido na 14.0.2. Tirar quando eles aceitarem. (Tambor, 01/11/2026)

## Comandos

`npm run app:dev` (abre o app de desenvolvimento, "DEV", com notas e configurações separadas do instalado; não usar `npm run tauri dev`) · `npm test` · `npm run e2e` (o app de verdade; fechar o app antes) · `npm run lint` · `npm run format` · `npm run build`
