# Registro do hansei

Cada achado do agente `hansei`, com o status. Gravado por `hansei-registro.mjs` (minhas-skills).
Um achado só sai de `aberto` pela decisão do usuário; `recusado pelo usuário` traz o motivo dele.

| ID | Data | Achado | Status | Decisão |
| --- | --- | --- | --- | --- |
| 2026-11-05-1 | 05/11/2026 | PR #42 (04/11): conferir no primeiro bom dia depois do merge que o auto-merge está ligado e que os PRs vieram nos grupos certos. | aceito |  |
| 2026-11-05-2 | 05/11/2026 | PR #42 (04/11): levar para a cartilha que o merge pelo GITHUB_TOKEN não dispara o CI na main (CI e CD agendados). | feito |  |
| 2026-11-05-3 | 05/11/2026 | A: o registro gravava a data em UTC (dia seguinte depois das 21h). Corrigido no PR #5 do minhas-skills, com teste. | aberto |  |
| 2026-11-05-4 | 05/11/2026 | B: no exigir-hansei, citar o ID -12 valia pelo -1. Corrigido no PR #5, com teste. | aberto |  |
| 2026-11-05-5 | 05/11/2026 | C: o settings.json e a lição apontam para arquivos que só existem na branch do PR #5 (ainda sem merge). | aberto |  |
| 2026-11-05-6 | 05/11/2026 | D: o teste do exigir-hansei não usa o formato literal da linha Hansei do agente; ler o formato do agents/hansei.md no teste. | aberto |  |
| 2026-11-05-7 | 05/11/2026 | E: o registro foi criado mas os achados do dia não estavam nele (gravados agora). | aberto |  |
| 2026-11-05-8 | 05/11/2026 | F: a conferência do auto-merge e do ruleset ficou só em texto; dá para um passo no CI agendado de terça falhar se mudar. | aberto |  |
| 2026-11-05-9 | 05/11/2026 | G: o minhas-skills não tem CI nem ruleset, e os hooks dele rodam em toda sessão; workflow com os testes no windows-latest e check exigido na main. | aberto |  |
