# Tambor de Notas — guia para o Claude

**Leia sempre, no início de toda sessão, os dois documentos-base do projeto:**

- [docs/instrucoes.md](docs/instrucoes.md) — fonte de verdade: visão, decisões técnicas, comportamento, requisitos e domínio.
- [docs/etapas-e-backlog.md](docs/etapas-e-backlog.md) — ordem das etapas, tarefas e definição de pronto.

Este arquivo é só um resumo. Em caso de dúvida ou conflito, valem os dois documentos acima.

## Como trabalhar com o Marcos

- Conversar em **português**. Código, nomes de arquivos e commits podem ficar em inglês.
- Ele é **iniciante**: explicar o porquê de cada passo, em termos simples, definindo jargão na primeira vez. Passos pequenos e verificáveis.
- **Antes de instalar qualquer coisa**, explicar o que é e por que é necessário, e esperar aprovação.
- **Mudanças importantes vão para debate antes** (trocar tecnologia, arquitetura, decisão dos documentos, comportamento de funcionalidade, nova biblioteca relevante): motivo, alternativas, impacto — e só seguir com aprovação.
- Detalhes de implementação podem ser decididos sozinho, com breve explicação.
- Faltando informação: **uma pergunta objetiva por vez**, com sugestão de resposta.
- Não refazer perguntas que os documentos já respondem.

## Regras do projeto

- **Trabalhar por etapas** (0 Fundação → 1 MVP → 2 Organização → 3 Integrações → 4 IA). **Nunca adiantar** funcionalidades de etapas futuras. Pontos em aberto de cada etapa são decididos no início dela.
- **Stack:** Tauri + React + TypeScript + Tailwind CSS, desenvolvido no **Windows nativo** (não no WSL). Rust no mínimo possível.
- **Arquitetura em 4 camadas** que não se misturam: interface, regras, armazenamento, integrações (integrações como adaptadores — padrão Adapter).
- **Qualidade:** TypeScript estrito, lint e formatação automática, testes nas partes críticas.
- **Repositório público no GitHub:** nenhuma chave de API ou dado pessoal no repositório. Usar arquivo de exemplo de configuração sem valores reais.
- Notas são arquivos `.md` locais com frontmatter; sem banco de dados.
- **IA:** nada é implementado antes da conversa de escopo no início da etapa 4.

## Definição de pronto (toda tarefa)

Funciona conforme os critérios · TypeScript estrito sem erros de lint · partes críticas testadas · nada sensível no repositório · commit com mensagem clara · Marcos testou e aprovou.
