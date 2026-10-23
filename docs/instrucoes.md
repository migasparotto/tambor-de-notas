# Tambor de Notas — Instruções do Projeto

Oct 19, 2026 · @Marcos

## Como trabalhar comigo

Este documento é a base do projeto: tudo o que está aqui já foi decidido. Use-o como fonte de verdade e não refaça perguntas que ele já responde.

- **Sou iniciante em programação.** Explique o porquê de cada passo, use termos simples e defina jargão na primeira vez que aparecer. Prefira passos pequenos e verificáveis a blocos grandes de código.
- **Mudanças importantes vêm para debate antes.** Trocar tecnologia, mudar a arquitetura, alterar uma decisão deste documento, mudar o comportamento de uma funcionalidade ou adicionar uma biblioteca relevante: apresente o motivo, as alternativas e o impacto, e só siga depois que eu aprovar.
- **Detalhes de implementação** (nome de variável, organização interna de um componente, escolha entre duas formas equivalentes) você pode decidir sozinho, explicando brevemente.
- **Trabalhe por etapas.** O documento "Tambor de Notas — Etapas e Backlog" define a ordem. Não adiante funcionalidades de etapas futuras.
- **Quando faltar informação**, faça uma pergunta objetiva por vez, com uma sugestão de resposta.
- **Ambiente:** notebook com Windows (também tenho Ubuntu via WSL, mas o app desktop é desenvolvido no Windows). Uso VS Code e GitHub.
- **Idioma:** converse comigo em português. Código, nomes de arquivos e commits podem ficar em inglês.

## Visão do produto

O Tambor de Notas é um app desktop de anotações rápidas para usar durante aulas e estudos. Ele captura notas e insights numa janela pequena e, depois, envia tudo organizado ao Notion, onde faço a revisão.

**Princípio central:** o app é para *anotar*, não para *guardar*. As notas ficam leves e de curta duração no app; o Notion é o arquivo completo e o lugar de revisão.

**Uso típico:** assistindo uma aula, abro a câmara da cor certa, anoto, fecho a nota e sigo a aula. Ao fechar, a nota vai para o Notion já classificada por cor e assunto.

**O conceito do tambor:** a interface imita o tambor (cilindro) de um revólver, mostrado como **meio cilindro** visível.

- **Centro do tambor:** o pomodoro (play, pause, stop).
- **7 câmaras ao redor:**
  - Câmaras 2 a 5: as quatro cores de nota (as "munições").
  - Câmara 6: Notion.
  - Câmara 7: Todoist.
  - Câmara 8: IA.
- A numeração segue o rascunho original: o centro é o 1, e as câmaras vão de 2 a 8.
- **Forma (mockup aprovado na etapa 1):** um meio anel em arco, encostado na borda direita da tela, com a abertura virada para a borda. As 7 câmaras são redondas e ficam ao longo do arco. O relógio do pomodoro fica no centro, no formato `88:88`. Um botão "+" fica na ponta de baixo do arco, separado das câmaras.
- **Tamanho:** o tambor ocupa no máximo **1/3 da altura da tela** (valor padrão), para não tampar o vídeo da aula. O tamanho é uma configuração.
- **Câmara de cor:** sem nota ativa, aparece só o contorno. Com nota ativa, a câmara fica preenchida e **enche conforme a nota se aproxima do limite de caracteres**.
- **Versão futura:** o tambor poderá girar com animação e revelar câmaras do "outro lado". O conteúdo dessas câmaras ainda não foi definido. Até lá, o "+" aparece, mas não gira.

## Decisões técnicas

O app é desktop, feito com **Tauri** e interface em **React + TypeScript + Tailwind CSS**, desenvolvido no Windows.

| Decisão | Escolha | Motivo |
| --- | --- | --- |
| Plataforma | Desktop (Windows) | Precisa salvar arquivos .md no disco e guardar chaves de API com segurança |
| Framework desktop | Tauri | App leve; a interface é web (React). Quase tudo se faz por plugins em TypeScript; o Rust fica no mínimo |
| Interface | React + TypeScript + Tailwind CSS | Stack escolhida desde o início |
| Ambiente de desenvolvimento | Windows nativo | Pelo WSL o build sairia como app de Linux |
| Armazenamento | Arquivos .md locais | Notas legíveis e portáveis, sem banco de dados obrigatório |
| Repositório | GitHub, **público** | Portfólio. Nenhuma chave ou dado pessoal pode ir para o repositório |
| Editor (etapa 1) | CodeMirror 6 com live preview próprio | Edita o próprio `.md`, que volta idêntico ao disco; Tiptap e BlockNote alteraram o texto no teste de ida e volta |
| Uso | Só eu, neste notebook, por enquanto | Mas sem amarrar o projeto: configurações em vez de valores fixos, para poder crescer depois |

### Arquitetura em camadas

O código é dividido em quatro camadas que não se misturam. Uma camada só conversa com a vizinha pelo que ela expõe.

1. **Interface:** o que aparece na tela. Tambor, editor, botões, lista de notas, configurações. Não contém regras de negócio nem acessa disco ou APIs direto.
2. **Regras:** a lógica do app. Pomodoro, criar e fechar nota, nota ativa por cor, contagem de caracteres, backlinks, sumário, decisão de quando enviar ao Notion.
3. **Armazenamento:** ler e escrever os arquivos .md e as configurações no disco.
4. **Integrações:** Notion, Todoist e IA. Cada integração é um **adaptador** com o mesmo formato (padrão *Adapter*), para que adicionar ou trocar uma integração não mexa no resto do app.

Esse é o único padrão de projeto exigido por enquanto. Outros só entram se resolverem um problema real, e com explicação.

### Qualidade de código

- TypeScript em modo estrito.
- Lint e formatação automática.
- Testes automatizados nas partes críticas: leitura e escrita de Markdown, backlinks, regras de envio ao Notion, pomodoro.
- Chaves de API fora do código. O repositório tem um arquivo de exemplo de configuração, sem valores reais.
- **Testes não dependem de valores fixos que serão configuráveis** (como os tempos do pomodoro): testam o comportamento com o valor configurado.
- **Testes que envolvem tempo usam tempo simulado** (fake timers), nunca espera real.

### Princípios de código

- Seguir **SOLID**, **KISS** e **DRY**, priorizando **KISS**: a solução mais simples que resolve o problema, sem complicar à toa.
- Documentar **funções públicas** com comentários curtos explicando o que fazem.
- Manter o **README atualizado a cada etapa**.

## Comportamento do app

### Janela

- Janela pequena, **sempre por cima** das outras, para ficar ao lado da aula.
- Janela **transparente e sem bordas**: aparece só o tambor, sem retângulo em volta.
- Fica **translúcida** quando não estou usando e **nítida** com uma nota aberta e em uso (e durante o aviso de fim de ciclo). Sem nota aberta, clicar no relógio, no stop ou no "+" não a deixa nítida e não tira o teclado do vídeo (decidido em 23/10/2026).
- **Editor em "bolha" (mockup C1, aprovado na etapa 1):** clicar numa câmara de cor faz o painel do editor nascer pequeno e redondo na própria câmara e crescer ao lado do tambor, que continua visível. O painel tem a cor da nota. Ao recolher ou fechar, ele encolhe de volta para a câmara. O painel é maior que o tambor, e um botão o expande para ler ou editar a nota inteira quando ela ficar grande.
- **Atalhos de teclado globais e configuráveis** para abrir cada cor e controlar o pomodoro. Eles funcionam mesmo com o app em segundo plano, enquanto uso o vídeo. A combinação padrão não pode conflitar com o teclado ABNT2 (AltGr = Ctrl+Alt no Windows) nem com atalhos comuns do Windows, do navegador, do VS Code e do Notion. **Padrão aprovado:** Ctrl+Shift+Alt+1/2/3/4 abre azul/vermelho/verde/roxo e Ctrl+Shift+Alt+P dá play ou pausa no pomodoro. **Esc** (decidido em 22/10/2026), em qualquer ponto da janela do tambor: com o painel aberto, recolhe a nota e devolve o teclado à janela que estava ativa antes (o vídeo); com o painel recolhido e o tambor em foco, só devolve o teclado. Para trocar de nota sem sair, clique em outra cor ou use o atalho. Com o painel aberto, Ctrl+Enter fecha a nota. Cliques no tambor que não abrem nota (relógio, stop, "+") não tiram o teclado do editor. Se um atalho já estiver em uso por outro programa, o app avisa. Os atalhos globais usam o plugin oficial global-shortcut do Tauri.

### Cores e suas funções

A **nota inteira** tem uma cor. A cor indica a **função** da nota, não a matéria.

| Cor | Função | Destino |
| --- | --- | --- |
| Azul | Glossário pessoal (termos e definições) | Notion |
| Vermelho | Núcleo de estudo ativo (o conteúdo principal da aula) | Notion |
| Verde | Exemplo de uso (exemplos práticos do que foi visto) | Notion |
| Roxo | Tarefa | Todoist (não vai ao Notion) |

- Essas são as **cores iniciais**. Cada cor tem nome e função editáveis.
- **Trocar a cor de uma câmara:** clique com o botão direito na câmara e escolha outra cor. Alternativa, se o botão direito for difícil: ao girar o tambor aparece uma câmara vazia com "+"; ali crio uma cor nova e escolho qual cor em uso ela substitui.
- **A cor de uma nota existente nunca muda.** Trocar a cor de uma câmara afeta só notas novas; notas antigas mantêm a cor e a função que tinham.
- Notas de cores diferentes podem se ligar por backlinks quando tratam do mesmo assunto.

### Notas

- Cada nota tem: cor (fixa), **assunto** (a matéria, ex.: "Cálculo"), título, conteúdo em Markdown e datas de criação e atualização.
- O campo **assunto** repete o último usado, para eu não digitar toda vez. No Notion ele vira uma coluna, ao lado da cor.
- **Uma nota ativa por cor.** Clicar numa câmara de cor abre a nota ativa daquela cor e continuo escrevendo nela. Só depois que eu fechar a nota (ou ela for enviada) o próximo clique cria uma nota nova.
- **Fechar uma nota** envia ao destino da cor (Notion ou Todoist) e move o arquivo local para a pasta de **arquivadas**.
- **Lista de notas** no app, com toggle list e sumário automático (TOC), para ver as notas abertas e arquivadas.
- **Salvamento automático** enquanto escrevo. Nenhuma nota pode se perder se o app fechar ou travar.

### Limite de tamanho e envio automático

A nota deve continuar leve; o arquivo completo fica no Notion.

- Existe um **limite de caracteres configurável** por nota, definido **num lugar só** do código e reaproveitado por todo o app.
- **Divisão entre etapas:** na **etapa 1** entram só o valor do limite (300, configurável) e a contagem de caracteres, para a câmara encher. Na **etapa 3** entram o aviso e o envio automático, usando o mesmo valor. A etapa 3 também reavalia se 300 é pouco. Regra de envio: **ao fechar a nota, envia na hora**; **com a câmara cheia e a nota aberta, envia na primeira pausa da digitação**.
- **Nunca enviar enquanto estou digitando.** Ao passar do limite, o app mostra um aviso discreto e espera eu terminar.
- O envio acontece quando: eu fecho a nota, **ou** confirmo o aviso ("ok"), **ou** fico um tempo sem digitar (tempo de inatividade configurável). Mesmo sem ação manual, a nota precisa ir.
- Depois do envio automático, a nota local é esvaziada e continuo escrevendo. O que eu escrever depois é **acrescentado à mesma página** do Notion.
- **Valor do limite:** começar em 300 caracteres e aumentar até achar o ponto ideal. Uma tarefa da etapa 3 mede o desempenho do editor com notas grandes para mostrar se há algum limite técnico; o esperado é que o limite seja uma escolha de uso (manter a nota leve), não de desempenho.

### Editor

- Estilo Notion: a formatação aparece enquanto digito (WYSIWYG), mas o conteúdo é salvo em Markdown. Feito com CodeMirror 6 editando o próprio `.md`, com os símbolos (`#`, `**`) escondidos ("live preview").
- Formatação rápida por atalhos de Markdown (`#`, `-`, `**`, etc.).
- Toggle list (bloco recolhível) e sumário automático (TOC) gerado pelos títulos.
- Espaçamento de linhas e margens ajustáveis.
- Como toggle list não existe no Markdown padrão, a forma de salvá-la no .md será proposta e debatida na etapa 2.

### Backlinks

- Sintaxe `[[nome da nota]]`, igual ao Obsidian.
- Funcionam entre notas de quaisquer cores.
- Cada nota mostra quais outras notas apontam para ela.
- No Notion, os backlinks viram links clicáveis entre as páginas.

### Pomodoro

- Fica no centro do tambor: clicar no relógio dá play ou pausa, e um botão pequeno de stop fica abaixo dele.
- Tempos de foco e pausa configuráveis.
- Ao fim de cada ciclo, um aviso simples.
- É independente das notas, mas registra quantos ciclos foram feitos.

## Integrações

### Notion (câmara 6)

O Notion é o arquivo completo e o lugar de revisão. O envio é **de mão única: app → Notion.** O app nunca lê alterações feitas no Notion.

- **Ambiente controlado:** uma página privada "Tambor de Notas" no Notion, contendo um banco de dados. A integração do app tem acesso só a essa página. O banco de dados fica **travado** (recurso de bloqueio do Notion) para eu não editar por engano.
- **Regra:** o Notion é só para ler e revisar. **Editar é sempre pelo app.** Qualquer edição feita direto no Notion pode ser sobrescrita.
- **Banco de dados** com uma página por nota e as colunas: título, cor, assunto, data de criação e data de envio.
- **Quando envia:** ao fechar a nota manualmente, e no envio automático por limite de tamanho (ver "Limite de tamanho e envio automático").
- **Notas que continuam:** o que for escrito depois de um envio automático é acrescentado à mesma página.
- **Backlinks** viram links entre as páginas do Notion. Se a nota de destino ainda não foi enviada, o link é resolvido quando ela for.
- **Atualização:** se uma nota arquivada for alterada no app (inclusive pela IA, na etapa 4), a página correspondente no Notion é atualizada.
- **Sem internet:** o envio entra numa fila e o app tenta de novo depois. A nota nunca se perde.
- Notas roxas (tarefas) **não** vão ao Notion.

### Todoist (câmara 7)

- **Nota roxa vira uma tarefa** no Todoist. A nota inteira é uma tarefa só.
- Mapeamento: título da nota → nome da tarefa; texto → descrição da tarefa; assunto → etiqueta (label) no Todoist.
- O envio acontece ao fechar a nota roxa, com a mesma fila de nova tentativa do Notion.

### IA (câmara 8)

O escopo da IA será definido **perto do início da etapa 4**, em conversa comigo. Não implementar nada de IA antes disso.

Ideias já levantadas, para servir de ponto de partida:

- Tirar dúvidas durante a aula.
- Perguntar se já existe algo escrito sobre um tema nas notas, no Notion ou no Todoist.
- Editar uma nota arquivada por comando escrito na câmara da IA (ex.: "vá até a nota X e altere tal informação") e atualizar o Notion junto.
- "Pedir para a IA fazer a integração": ideia ainda ambígua, a esclarecer.

O provedor de IA (qual serviço e modelo) também será escolhido nessa etapa.

## Requisitos

### Funcionais (o que o usuário faz)

| ID | Requisito | Etapa |
| --- | --- | --- |
| RF01 | Escrever notas em Markdown com editor estilo Notion e formatação rápida | 1 |
| RF02 | Pomodoro com play, pause e stop, tempos configuráveis, aviso e contador de ciclos | 1 |
| RF03 | Criar ou continuar a nota ativa de uma cor clicando na câmara | 1 |
| RF04 | Salvar notas localmente em .md, com salvamento automático | 1 |
| RF05 | Fechar nota e arquivá-la localmente | 1 |
| RF06 | Personalizar cores das câmaras (nome, função, troca) | 2 |
| RF07 | Definir o assunto da nota | 2 |
| RF08 | Backlinks com `[[ ]]` | 2 |
| RF09 | Toggle list | 2 |
| RF10 | Sumário automático (TOC) | 2 |
| RF11 | Lista e busca de notas | 2 |
| RF12 | Exportar nota em .md | 2 |
| RF13 | Ajustar espaçamento de linhas e margens | 2 |
| RF14 | Enviar nota ao Notion ao fechar e por limite de tamanho | 3 |
| RF15 | Backlinks como links entre páginas do Notion | 3 |
| RF16 | Enviar nota roxa como tarefa ao Todoist | 3 |
| RF17 | Assistente de IA (escopo definido na etapa 4) | 4 |

### Não funcionais (qualidades do sistema)

| ID | Requisito |
| --- | --- |
| RNF01 | **Desempenho:** notas longas abrem, rolam e aceitam digitação sem travar |
| RNF02 | **Offline:** tudo funciona sem internet, exceto as integrações |
| RNF03 | **Confiabilidade:** salvamento automático; nenhuma nota se perde; envios que falham entram numa fila e são tentados de novo |
| RNF04 | **Segurança:** chaves de API guardadas de forma protegida no sistema, nunca no código nem no repositório |
| RNF05 | **Usabilidade:** abrir, escrever e fechar uma nota em poucos cliques, sem atrapalhar a aula; nunca interromper a digitação |
| RNF06 | **Manutenibilidade:** TypeScript estrito, camadas separadas, testes nas partes críticas |
| RNF07 | **Extensibilidade:** configurações em vez de valores fixos e integrações como adaptadores, para o app poder crescer |

## Modelo de domínio e armazenamento

Não há banco de dados. Cada nota é um arquivo .md com um cabeçalho de metadados (frontmatter); configurações e contadores ficam em arquivos de configuração locais.

### Entidades

| Entidade | O que guarda |
| --- | --- |
| **Nota** | id, título, cor (fixa), assunto, conteúdo em Markdown, estado (ativa ou arquivada), datas de criação e atualização, id da página ou tarefa de destino |
| **Cor** | id, nome, função, cor visual, câmara que ocupa no tambor (ou nenhuma), destino (Notion ou Todoist) |
| **Backlink** | nota de origem e nota de destino, extraídos da sintaxe `[[ ]]` no conteúdo |
| **Pomodoro** | tempos configurados e contador de ciclos concluídos |
| **Envio pendente** | nota, destino e número de tentativas (a fila de nova tentativa) |
| **Configurações** | limite de caracteres, tempo de inatividade, espaçamento, margens, assunto padrão, tamanho do tambor, atalhos de teclado |

### Regras do domínio

- Só existe **uma nota ativa por cor** ao mesmo tempo.
- A cor de uma nota **nunca muda** depois de criada.
- Uma cor removida do tambor continua existindo para as notas antigas.
- Ao fechar, a nota muda de "ativa" para "arquivada" e é enviada ao destino da sua cor.
- Notas roxas vão ao Todoist; as demais, ao Notion.

### Pastas no disco

- `notas/ativas/`: notas em uso (no máximo uma por cor).
- `notas/arquivadas/`: notas fechadas ou já enviadas.
- Arquivos de configuração do app, fora do repositório do código.

As chaves de API **não** ficam nesses arquivos: são guardadas pelo armazenamento seguro do sistema. A forma exata será proposta na etapa 3.

## Fora do escopo e pontos em aberto

### Fora do escopo desta versão

- Gravação de áudio e transcrição.
- Câmaras do "outro lado" do tambor e a animação de giro completa.
- Sincronização de mão dupla com o Notion.
- Distribuição do app para outras pessoas.

Esses itens ficam registrados para versões futuras e evoluem conforme o projeto andar.

### Pontos em aberto (decidir na etapa indicada)

- **Etapa 1:** ~~desenho da tela completa e de como o editor surge do tambor~~ (decidido: variação C1, "bolha"); ~~combinação padrão dos atalhos globais~~ (decidido: Ctrl+Shift+Alt, ver "Janela").
- **Etapa 2:** como salvar toggle list no arquivo .md.
- **Etapa 3:** valor final do limite de caracteres e do tempo de inatividade; em qual projeto do Todoist as tarefas caem; forma de guardar as chaves de API.
- **Etapa 4:** escopo da IA e provedor.
