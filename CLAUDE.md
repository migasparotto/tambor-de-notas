# Tambor de Notas — guia para o Claude

**Leia sempre, no início de toda sessão, os dois documentos-base do projeto:**

- [docs/instrucoes.md](docs/instrucoes.md) — fonte de verdade: visão, decisões técnicas, comportamento, requisitos e domínio.
- [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md) — ordem das etapas, tarefas e definição de pronto.

Este arquivo é só um resumo. Em caso de dúvida ou conflito, valem os dois documentos acima.

## Comandos rápidos

- **`executar pmp boa noite`:** marcar como concluídas, em [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md), as tarefas que já terminamos e anotar ali o próximo passo. Depois, mostrar o que mudou desde o último envio e, **com aprovação**, fazer o commit e enviar ao GitHub.
- **`executar pmp bom dia`:** ler o CLAUDE.md e os arquivos em `docs/`, ver em [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md) o que já foi concluído e continuar de onde paramos.

## Como trabalhar com o Marcos

- Conversar em **português**. Código, nomes de arquivos e commits podem ficar em inglês.
- Ele é **iniciante**: explicar o porquê de cada passo, em termos simples, definindo jargão na primeira vez. Passos pequenos e verificáveis.
- **Antes de instalar qualquer coisa**, explicar o que é e por que é necessário, e esperar aprovação.
- **Mudanças importantes vão para debate antes** (trocar tecnologia, arquitetura, decisão dos documentos, comportamento de funcionalidade, nova biblioteca relevante): motivo, alternativas, impacto — e só seguir com aprovação.
- Detalhes de implementação podem ser decididos sozinho, com breve explicação.
- Faltando informação: **uma pergunta objetiva por vez**, com sugestão de resposta.
- Não refazer perguntas que os documentos já respondem.

## Regras do projeto

- **Trabalhar por etapas** (0 Fundação → 1 MVP → 2 Organização → 3 Integrações → 4 IA). **Nunca adiantar** funcionalidades de etapas futuras. Pontos em aberto de cada etapa são decididos no início dela.
- **Stack:** Tauri + React + TypeScript + Tailwind CSS, desenvolvido no **Windows nativo** (não no WSL). Rust no mínimo possível.
- **Arquitetura em 4 camadas** que não se misturam: interface, regras, armazenamento, integrações (integrações como adaptadores — padrão Adapter).
- **Qualidade:** TypeScript estrito, lint e formatação automática, testes nas partes críticas.
- **Testes:** nunca depender de valores fixos que serão configuráveis (ex.: tempos do pomodoro) — testar o comportamento com o valor configurado; tudo que envolve tempo usa tempo simulado (fake timers do Vitest).
- **Commits e push:** fazer um commit a cada tarefa terminada, só com lint e testes passando. O push acontece no "pmp boa noite" ou ao fim de cada sprint.
- **Sprints:** a lógica vai em `src/domain/`, com testes, antes da tela. Fim de sprint = CI verde, README atualizado e push.
- **Repositório público no GitHub:** nenhuma chave de API ou dado pessoal no repositório. Usar arquivo de exemplo de configuração sem valores reais.
- Notas são arquivos `.md` locais com frontmatter; sem banco de dados.
- **IA:** nada é implementado antes da conversa de escopo no início da etapa 4.

## Princípios de código

- Seguir **SOLID**, **KISS** e **DRY**, priorizando **KISS**: a solução mais simples que resolve o problema, sem complicar à toa.
- Documentar **funções públicas** com comentários curtos explicando o que fazem.
- Manter o **README atualizado a cada etapa**.

## Comandos

`npm run tauri dev` (abre o app) · `npm test` · `npm run lint` · `npm run format` · `npm run build`

## Definição de pronto (toda tarefa)

Funciona conforme os critérios · TypeScript estrito sem erros de lint · partes críticas testadas · nada sensível no repositório · commit com mensagem clara · Marcos testou e aprovou.
