# Registro do hansei

Cada achado do agente `hansei`, com o status. Gravado por `hansei-registro.mjs` (minhas-skills).
Um achado só sai de `aberto` pela decisão do usuário; `recusado pelo usuário` traz o motivo dele.

| ID | Data | Achado | Status | Decisão |
| --- | --- | --- | --- | --- |
| 2026-11-05-1 | 05/11/2026 | PR #42 (04/11): conferir no primeiro bom dia depois do merge que o auto-merge está ligado e que os PRs vieram nos grupos certos. | aceito |  |
| 2026-11-05-2 | 05/11/2026 | PR #42 (04/11): levar para a cartilha que o merge pelo GITHUB_TOKEN não dispara o CI na main (CI e CD agendados). | feito |  |
| 2026-11-05-3 | 05/11/2026 | A: o registro gravava a data em UTC (dia seguinte depois das 21h). Corrigido no PR #5 do minhas-skills, com teste. | feito |  |
| 2026-11-05-4 | 05/11/2026 | B: no exigir-hansei, citar o ID -12 valia pelo -1. Corrigido no PR #5, com teste. | feito |  |
| 2026-11-05-5 | 05/11/2026 | C: o settings.json e a lição apontam para arquivos que só existem na branch do PR #5 (ainda sem merge). | feito |  |
| 2026-11-05-6 | 05/11/2026 | D: o teste do exigir-hansei não usa o formato literal da linha Hansei do agente; ler o formato do agents/hansei.md no teste. | aceito |  |
| 2026-11-05-7 | 05/11/2026 | E: o registro foi criado mas os achados do dia não estavam nele (gravados agora). | feito |  |
| 2026-11-05-8 | 05/11/2026 | F: a conferência do auto-merge e do ruleset ficou só em texto; dá para um passo no CI agendado de terça falhar se mudar. | feito |  |
| 2026-11-05-9 | 05/11/2026 | G: o minhas-skills não tem CI nem ruleset, e os hooks dele rodam em toda sessão; workflow com os testes no windows-latest e check exigido na main. | aceito |  |
| 2026-11-05-10 | 05/11/2026 | PR #43 entrou por auto-merge às 04:40:11, antes do instalador terminar (04:43 e 04:45): o ruleset só exige check, rust e e2e, e o CLAUDE.md do projeto afirma que o merge espera o instalador. | aceito |  |
| 2026-11-05-11 | 05/11/2026 | A correção do UTC no hansei-registro não procurou o irmão: prs-do-dia.mjs usa merged:<dia> (UTC) e o teste dele fixa esse comportamento (scripts.test.mjs:55). | aceito |  |
| 2026-11-05-12 | 05/11/2026 | As três falhas que o usuário achou hoje (condição do CD na regra do Dependabot, hook bloqueando em vez de avisar, dois auto-merges sem teste combinado) não viraram pergunta no agents/hansei.md nem lição, como manda a regra do ponto cego. | aceito |  |
| 2026-11-05-13 | 05/11/2026 | O job configuracao confere só check, e2e e rust; quando o instalador entrar no ruleset, a retirada dele passaria sem aviso. | feito | Usuário pôs o instalador no ruleset em 05/11/2026 (16:37); o laço do job configuracao passou a exigir o instalador (conferido localmente contra a main). |
| 2026-11-05-14 | 05/11/2026 | Bom dia 06/11: o kaizen 'conferir se o app dev já está aberto' ficou só em texto no CLAUDE.md; dá para um script de pré-checagem (porta 1420 e tambor-de-notas.exe com PID) no app:dev e também no e2e, que hoje só diz 'fechar o app antes'. | aceito | Usuário aprovou em 05/11/2026: criar scripts/app-aberto.mjs como proposto. |
| 2026-11-05-15 | 05/11/2026 | Bom dia 06/11: a ordem sugerida (9, 4, 10, S4) deixa de fora sem motivo os itens 3 (conferir os grupos do Dependabot, achado 2026-11-05-1), 12 (nome do ruleset) e 13 (Notion), e não separa os itens do usuário (1 teste rápido da v0.5.0, 2 instalador no ruleset e proteção do minhas-skills). | feito | Usuário aprovou em 05/11/2026: regra no comando bom dia do CLAUDE.md de usuário (todo item do Próximo recebe destino: agora, depois com motivo, do usuário). |
