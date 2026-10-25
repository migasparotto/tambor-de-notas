# ui — Interface (camada 1)

O que aparece na tela: tambor, editor, botões, lista de notas, configurações.

- **Pode usar:** `domain/` (as regras).
- **Não pode:** conter regras de negócio, nem acessar disco (`storage/`) ou APIs (`integrations/`) diretamente.

## Como está organizado

- `App.tsx`: junta tambor, painel e caderno.
- `Drum.tsx`: o tambor (câmaras tingidas e enchendo, relógio, stop, "+").
- `NotePanel.tsx`: o painel bolha (nasce na câmara, cresce ao lado do tambor, expande, recolhe, fecha a nota).
- `NoteEditor.tsx`: o editor das notas (CodeMirror 6). Recebe `text` (o Markdown) e avisa `onChange`.
- `editor/`: regras de edição (`# ` no título, `+texto+` → `## texto`, Ctrl+B/Ctrl+I) e o live preview (esconder símbolos e formatar), com testes que rodam sem abrir janela.
- `useAppWindow.ts`: tamanho e posição da janela (o tambor nunca sai do lugar).
- `useNotebook.ts`: liga o caderno (`domain/notebook.ts`) ao React e salva tudo ao fechar a janela.
- `usePomodoro.ts`: liga o pomodoro ao React.
- `trayIcon.ts`: o ícone na bandeja do Windows, com o menu "Sair" (fecha pelo caminho normal, salvando as notas).
