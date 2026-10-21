# domain — Regras (camada 2)

A lógica do app: pomodoro, criar e fechar nota, nota ativa por cor, contagem de caracteres, backlinks, sumário, decisão de quando enviar ao Notion.

- **Pode usar:** `storage/` (para ler e gravar) e `integrations/` (para enviar), sempre pelo que essas camadas expõem.
- **Não pode:** depender de `ui/` (nada de React aqui). Assim as regras podem ser testadas sozinhas.

## Notas (S3)

- `noteText.ts`: título (primeira linha), subtítulo `+texto+` ↔ `## texto`, contagem de caracteres e enchimento da câmara.
- `noteFile.ts`: o arquivo `.md` (frontmatter + texto em Markdown) e o nome `AAAA-MM cor - título`.
- `notebook.ts`: uma nota ativa por cor, salvamento automático, renomear no primeiro Enter, fechar e arquivar.
