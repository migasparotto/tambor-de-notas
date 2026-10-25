# domain — Regras (camada 2)

A lógica do app: pomodoro, criar e fechar nota, nota ativa por cor, contagem de caracteres, backlinks, sumário, decisão de quando enviar ao Notion.

- **Pode usar:** `storage/` (para ler e gravar) e `integrations/` (para enviar), sempre pelo que essas camadas expõem.
- **Não pode:** depender de `ui/` (nada de React aqui). Assim as regras podem ser testadas sozinhas.

## Notas (S3)

- `noteText.ts`: título (`# ` na primeira linha), `+texto+` → `## texto`, contagem de caracteres e enchimento da câmara. O texto da nota é o próprio Markdown.
- `noteFile.ts`: o arquivo `.md` (frontmatter + texto em Markdown) e o nome `AAAA-MM cor - título`.
- `notebook.ts`: notas ativas por cor (limite em `settings.ts`, hoje 1), salvamento automático, renomear no primeiro Enter, fechar e arquivar.
- `livePreview.ts`: quando o editor mostra os símbolos do Markdown, conforme o modo da configuração e o cursor.

## Assunto (Etapa 2, S2)

- `colorData.ts`: o que o app lembra de cada cor, no arquivo `cores.json` (hoje, o último assunto usado). Arquivo faltando ou quebrado vira "nada lembrado", sem erro.
