# Tambor de Notas — Etapas e Backlog

Oct 19, 2026 · @Marcos

## Como usar este backlog

O projeto tem cinco etapas, feitas em ordem: 0 Fundação, 1 MVP utilizável, 2 Organização, 3 Integrações, 4 IA. Ao fim de cada etapa o app já é usável no dia a dia.

- **Etapas são as sprints principais.** Dentro de cada uma, as tarefas são agrupadas em sprints internas curtas (sugestão: uma a duas semanas cada). A divisão das sprints internas é feita no começo de cada etapa, junto comigo.
- **Não adiantar etapas.** Funcionalidades de uma etapa futura não entram antes da hora, nem "só um pouco".
- **Os IDs de requisito** (RF01, RNF01...) vêm do documento "Tambor de Notas — Instruções do Projeto", que é a fonte das regras de comportamento.
- **Pontos em aberto** de cada etapa são decididos no início dela, antes de programar.

### Definição de pronto (vale para toda tarefa)

- Funciona como descrito nos critérios de aceite.
- Código em TypeScript estrito, sem erros de lint.
- Partes críticas com teste automatizado.
- Nenhuma chave ou dado pessoal no repositório.
- Commit no GitHub com mensagem clara.
- Eu testei e aprovei.

## Etapa 0 — Fundação

**Objetivo:** ambiente pronto e projeto vazio rodando, com a estrutura certa desde o início.

**Pronto quando:** um app Tauri com React + TypeScript + Tailwind abre uma janela no Windows, o código está no GitHub público e as pastas seguem as quatro camadas.

- [ ] Instalar no Windows o que o Tauri exige (Node.js, Rust e dependências do sistema), com explicação de cada item
- [ ] Criar o projeto Tauri com React + TypeScript + Tailwind CSS
- [ ] Criar o repositório público no GitHub, com README (o que é o projeto e como rodar) e `.gitignore`
- [ ] Garantir que chaves e dados pessoais nunca vão ao repositório (arquivo de exemplo de configuração, sem valores reais)
- [ ] Criar a estrutura de pastas por camada: interface, regras, armazenamento, integrações
- [ ] Ativar TypeScript estrito, lint e formatação automática
- [ ] Configurar o primeiro teste automatizado de exemplo, para o fluxo de testes já existir

## Etapa 1 — MVP utilizável

**Objetivo:** já dá para usar numa aula de verdade: abrir uma cor, anotar, fechar a nota e usar o pomodoro.

**Pronto quando:** consigo assistir uma aula com o app aberto por cima, anotar nas quatro cores, fechar as notas e encontrá-las arquivadas em .md no disco. Requisitos: RF01 a RF05.

**Decidir antes de programar:** mockup da tela completa e de como o editor surge a partir do tambor.

### Janela

- [ ] Janela pequena, sempre por cima das outras
- [ ] Translúcida quando sem foco, nítida ao clicar

### Tambor

- [ ] Desenhar o meio cilindro com o centro e as 7 câmaras
- [ ] Câmaras 2 a 5 com as cores iniciais: azul (glossário pessoal), vermelho (núcleo de estudo ativo), verde (exemplo de uso), roxo (tarefa)
- [ ] Câmaras 6, 7 e 8 (Notion, Todoist, IA) visíveis, mas desativadas até suas etapas

### Pomodoro (RF02)

- [ ] Play, pause e stop no centro do tambor
- [ ] Tempos de foco e pausa configuráveis
- [ ] Aviso simples ao fim de cada ciclo
- [ ] Contador de ciclos concluídos, salvo entre usos do app
- [ ] Testes da lógica do pomodoro

### Notas (RF01, RF03, RF04, RF05)

- [ ] Clicar numa câmara de cor abre a nota ativa daquela cor ou cria uma nova
- [ ] Editor estilo Notion (formatação aparece enquanto digito), salvando em Markdown
- [ ] Atalhos de formatação rápida em Markdown
- [ ] Salvamento automático em `notas/ativas/`, com metadados no cabeçalho do arquivo
- [ ] Fechar a nota move o arquivo para `notas/arquivadas/` e libera a cor para uma nota nova
- [ ] Testes de leitura e escrita dos arquivos .md

## Etapa 2 — Organização

**Objetivo:** as notas ficam organizadas, conectadas e fáceis de achar.

**Pronto quando:** consigo personalizar as cores, definir o assunto, ligar notas com backlinks, usar toggle list e sumário, buscar notas e exportar em .md. Requisitos: RF06 a RF13.

**Decidir antes de programar:** como salvar toggle list no arquivo .md.

### Cores (RF06)

- [ ] Editar nome e função de cada cor
- [ ] Trocar a cor de uma câmara pelo botão direito
- [ ] Alternativa: câmara "+" para criar uma cor nova e escolher qual cor em uso ela substitui
- [ ] Notas antigas mantêm sua cor quando a câmara muda

### Assunto (RF07)

- [ ] Campo assunto em cada nota
- [ ] Preencher automaticamente com o último assunto usado

### Backlinks (RF08)

- [ ] Reconhecer `[[nome da nota]]` no texto e transformar em link clicável
- [ ] Sugerir nomes de notas ao digitar `[[`
- [ ] Painel na nota com as notas que apontam para ela
- [ ] Testes de extração de backlinks

### Editor (RF09, RF10, RF13)

- [ ] Toggle list (bloco recolhível)
- [ ] Sumário automático (TOC) gerado pelos títulos da nota
- [ ] Ajuste de espaçamento de linhas e margens

### Lista, busca e exportação (RF11, RF12)

- [ ] Lista de notas ativas e arquivadas, filtrável por cor e assunto
- [ ] Busca por texto nas notas
- [ ] Exportar uma nota em .md para uma pasta escolhida

## Etapa 3 — Integrações

**Objetivo:** as notas saem do app sozinhas e chegam organizadas no Notion e no Todoist.

**Pronto quando:** fechar uma nota a envia ao destino certo, o envio automático por tamanho funciona sem me interromper, e nada se perde sem internet. Requisitos: RF14 a RF16.

**Decidir antes de programar:** forma de guardar as chaves de API; em qual projeto do Todoist as tarefas caem.

### Base das integrações

- [ ] Adaptador comum para integrações (padrão Adapter), usado por Notion e Todoist
- [ ] Guardar as chaves de API no armazenamento seguro do sistema
- [ ] Fila de envio: sem internet ou com erro, tentar de novo depois
- [ ] Ativar as câmaras 6 (Notion) e 7 (Todoist) mostrando o estado da conexão

### Notion (RF14, RF15)

- [ ] Guia passo a passo para eu criar a página privada "Tambor de Notas" e conectar a integração só a ela
- [ ] Criar o banco de dados com as colunas título, cor, assunto, data de criação e data de envio
- [ ] Orientar o bloqueio do banco de dados no Notion, para evitar edição por engano
- [ ] Enviar a nota ao fechar
- [ ] Atualizar a página quando uma nota arquivada mudar no app
- [ ] Backlinks viram links entre páginas; links para notas ainda não enviadas são resolvidos depois
- [ ] Testes das regras de envio

### Limite de tamanho e envio automático (RF14)

- [ ] Teste de desempenho do editor com notas grandes, para saber se existe limite técnico
- [ ] Limite de caracteres configurável, começando em 300
- [ ] Ao passar do limite, aviso discreto, sem interromper a digitação
- [ ] Enviar ao confirmar o aviso, ao fechar a nota ou após o tempo de inatividade configurável
- [ ] Depois do envio, esvaziar a nota local e acrescentar o que vier depois à mesma página do Notion
- [ ] Calibrar comigo o limite e o tempo de inatividade ideais

### Todoist (RF16)

- [ ] Ao fechar uma nota roxa, criar uma tarefa: título → nome, texto → descrição, assunto → etiqueta
- [ ] Notas roxas não vão ao Notion

## Etapa 4 — IA

**Objetivo:** a câmara 8 vira um assistente que ajuda durante o estudo.

**Pronto quando:** as funções de IA escolhidas no início da etapa funcionam pela câmara 8. Requisito: RF17.

**Decidir antes de programar:** o escopo da IA e o provedor (serviço e modelo). Nada de IA é implementado antes dessa conversa.

- [ ] Conversa de escopo comigo, partindo das ideias já levantadas: tirar dúvidas; perguntar se já existe algo escrito nas notas, no Notion ou no Todoist; editar nota arquivada por comando e atualizar o Notion; esclarecer a ideia de "pedir para a IA fazer a integração"
- [ ] Escolher o provedor de IA e guardar sua chave como as demais
- [ ] Criar o adaptador de IA no mesmo formato das outras integrações
- [ ] Ativar a câmara 8
- [ ] Quebrar em tarefas as funções escolhidas e implementá-las

## Futuro (v2+)

Ideias registradas para depois da etapa 4. Nenhuma entra antes sem ser debatida comigo.

- Gravação de áudio e transcrição.
- Animação de giro do tambor e câmaras do "outro lado" (conteúdo a definir).
- Distribuir o app para outras pessoas (instalador, atualizações).
- Agrupar notas por assunto como uma visão de backlinks (ideia surgida ao definir o campo assunto).
