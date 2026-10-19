# integrations — Integrações (camada 4)

Notion, Todoist e IA. Cada integração é um **adaptador** com o mesmo formato (padrão *Adapter*), para que adicionar ou trocar uma integração não mexa no resto do app.

- **Pode usar:** apenas bibliotecas e plugins para falar com os serviços externos.
- **Não pode:** depender de `ui/`, `domain/` ou `storage/`.
