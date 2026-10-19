# domain — Regras (camada 2)

A lógica do app: pomodoro, criar e fechar nota, nota ativa por cor, contagem de caracteres, backlinks, sumário, decisão de quando enviar ao Notion.

- **Pode usar:** `storage/` (para ler e gravar) e `integrations/` (para enviar), sempre pelo que essas camadas expõem.
- **Não pode:** depender de `ui/` (nada de React aqui). Assim as regras podem ser testadas sozinhas.
