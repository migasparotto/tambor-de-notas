# ui — Interface (camada 1)

O que aparece na tela: tambor, editor, botões, lista de notas, configurações.

- **Pode usar:** `domain/` (as regras).
- **Não pode:** conter regras de negócio, nem acessar disco (`storage/`) ou APIs (`integrations/`) diretamente.

## Como está organizado

- `App.tsx`: junta tambor, painel e caderno.
- `Drum.tsx`: o tambor (câmaras tingidas e enchendo, relógio, stop, "+").
- `NotePanel.tsx`: o painel bolha (nasce na câmara, cresce ao lado do tambor, expande, recolhe, fecha a nota).
- `NoteEditor.tsx`: campo de título + campo de texto simples. Recebe `text` e avisa `onChange`; o editor da S4 o substitui.
- `useAppWindow.ts`: tamanho e posição da janela (o tambor nunca sai do lugar).
- `useNotebook.ts`: liga o caderno (`domain/notebook.ts`) ao React e salva tudo ao fechar a janela.
- `usePomodoro.ts`: liga o pomodoro ao React.
