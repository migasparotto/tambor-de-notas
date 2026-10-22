# storage — Armazenamento (camada 3)

Ler e escrever os arquivos `.md` das notas e as configurações no disco.

- **Pode usar:** apenas bibliotecas e plugins do Tauri para acesso ao disco.
- **Não pode:** depender de `ui/`, `domain/` ou `integrations/`.

## Como está organizado

- `notesStore.ts`: a **porta única** das notas (listar, ler, salvar, criar, arquivar, mover sobras de `.tmp` para `sobras/`). O resto do app usa só ela.
- `fileSystem.ts`: as poucas operações de disco que a porta precisa. Não existe "apagar": arquivar é renomear.
- `tauriFileSystem.ts`: o disco de verdade, pelo plugin `fs`, dentro de `Documentos\Tambor de Notas\notas\`.
- `memoryFileSystem.ts`: um disco em memória, para os testes.
- `fileName.ts`: nome de arquivo aceito pelo Windows, sem repetir nomes.
- `retry.ts`: tenta de novo quando o OneDrive segura o arquivo, e dá uma mensagem clara se não der.
