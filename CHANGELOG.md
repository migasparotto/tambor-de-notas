# Changelog

O que mudou em cada versão, para quem usa o app. O texto de cada versão vira as notas do release no GitHub.

## Não lançado

### Novidades

- **Log do app:** o app guarda um registro do que faz em `%LOCALAPPDATA%\com.tambordenotas.app\logs` (abertura, fechamento, erros e um sinal a cada 5 minutos com a memória usada), para ajudar a descobrir por que ele caiu. O registro nunca contém o texto, o título, o assunto, o caminho nem o nome dos arquivos das notas, e ocupa no máximo 5 arquivos de 1 MB.

## [0.4.0] - 2026-11-02

### Novidades

- **Outro lado do tambor:** o botão "+" gira o tambor meia volta, com o som da catraca, até uma câmara vazia, e de volta. Um atalho de cor volta para a frente. O clique não tira o teclado do vídeo nem da nota.
- **Cor nova:** a câmara vazia deixa criar uma cor, com nome, função e um tom da paleta, no lugar da câmara que você escolher. A nota dela já abre, com o cursor no assunto.
- **Cores fora do tambor:** nenhuma cor é apagada. A que sai do tambor fica listada na câmara vazia, com a nota ativa embaixo, para continuar, e pode voltar para a câmara que você escolher.
- **Editar a cor na nota aberta:** o rótulo agora mostra a função, com um círculo no tom da cor. Clique no texto para mudar o nome e a função, e no círculo para trocar o tom.
- Os atalhos Ctrl+Shift+Alt+1 a 4 abrem a câmara daquele lugar, qualquer que seja a cor que esteja nela.
- Uma nota de uma cor que o app não conhece abre mesmo assim, em tom neutro e com um aviso, sem ser alterada.
- Quando há mais de um aviso ao abrir o app, eles aparecem um depois do outro.

### Correções

- Se o arquivo das cores estiver quebrado, o app abre com as cores padrão, avisa e não o sobrescreve.
- O roxo ficou um pouco mais claro, para o texto do painel continuar legível.

### Instalação

Baixe o `Tambor.de.Notas_0.4.0_x64-setup.exe` abaixo e instale por cima da v0.3.0. As notas e as configurações continuam onde estão, e as quatro cores ficam nos mesmos lugares.

## [0.3.0] - 2026-11-01

### Novidades

- **Assunto da nota:** cada nota tem agora uma linha "Assunto" (a matéria, como "Cálculo"), logo acima do título.
- Cada cor lembra o último assunto usado, e a nota nova dessa cor já vem com ele preenchido.
- Enter no assunto leva ao título. Esc e Ctrl+Enter funcionam ali como no resto da nota.
- As notas criadas antes desta versão continuam intactas e abrem com o assunto vazio.

### Instalação

Baixe o `Tambor.de.Notas_0.3.0_x64-setup.exe` abaixo e instale por cima da v0.2.0. As notas e as configurações continuam onde estão.

## [0.2.0] - 2026-10-25

### Novidades

- Arrastar o tambor: segure parado por um instante e arraste para cima, para baixo ou para a borda esquerda (o tambor espelha). A posição é lembrada ao reabrir.
- Ícone na bandeja do Windows com o menu "Sair" (as notas são salvas antes de fechar).
- O clique passa pelos cantos vazios da janela para o que está atrás (o vídeo, por exemplo).

### Instalação

Baixe o `Tambor.de.Notas_0.2.0_x64-setup.exe` abaixo e instale por cima da v0.1.0. As notas e as configurações continuam onde estão.

## [0.1.0] - 2026-10-23

### Novidades

- Primeira versão: tambor sempre por cima, notas nas quatro cores salvas em `.md`, editor com formatação enquanto se digita, pomodoro e atalhos globais.
