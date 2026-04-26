# 🚀 SaaS Suporte de TI: Central de Atendimento Inteligente

Este ecossistema foi desenvolvido para **centralizar o suporte de TI em um único lugar**, eliminando o fluxo caótico de mensagens privadas e informais enviadas diretamente aos técnicos. A solução une o **WhatsApp** com o poder da **Inteligência Artificial** e a eficiência de uma **Dashboard Kanban** moderna.

---

## 🎯 Objetivo do Sistema

O foco principal é a **produtividade e a organização**. Ao centralizar as demandas:
1.  **Fim das interrupções:** Técnicos não recebem mais chamados via chat privado.
2.  **Triagem Autônoma:** O chatbot atua como Nível 1, resolvendo problemas comuns via **RAG** sem intervenção humana.
3.  **Escalonamento Inteligente:** Se a IA não resolver, o chamado é aberto e enviado para a Dashboard.

---

## 🏗️ Como o Sistema Funciona (IA-First)

1.  **Entrada:** O usuário descreve o problema via WhatsApp (**Evolution API**).
2.  **Triagem:** O sistema transcreve áudios e analisa imagens de erro (Prints).
3.  **Resolução Autônoma:** O chatbot consulta a base de conhecimento no **Supabase** e tenta resolver via **RAG**.
4.  **Abertura de Chamado:** Caso o problema persista, o bot gera um ticket estruturado.
5.  **Gestão:** O técnico assume o chamado via **Dashboard Kanban**.

---

## 🤖 Parte 1: Arquitetura do Chatbot (n8n)

O chatbot foi construído com uma arquitetura de microsserviços, dividido em **7 workflows integrados** para garantir modularidade e fácil manutenção.

### 1. Workflow Principal (Maestro)
> ![Workflow Maestro](./assets/chatbot-suporte-ti.png)

### 2. Validação de CPF
> ![Workflow Validação de CPF](./assets/validacao-cpf.png)

### 3. Processador de Imagem
> ![Workflow Processador de Imagem](./assets/processador-imagem.png)

### 4. Pré-Atendimento (RAG)
> ![Workflow Pré-Atendimento RAG](./assets/pre-atendimento-rag.png)

### 5. Criando Chamados
> ![Workflow Criando Chamados](./assets/criando-chamados.png)

### 6. API - Enviar Mensagem
> ![Workflow API Enviar Mensagem](./assets/api-enviar-mensagem.png)

### 7. Alimentação da IA (RAG)
> ![Workflow Alimentação da IA](./assets/alimentacao-ia-rag.png)

---

## 💻 Parte 2: Dashboard Administrativa (Lovable + React)

A interface de gestão foi desenvolvida para oferecer controle total sobre o ecossistema de suporte, permitindo que a equipe de TI gerencie chamados, usuários e a base de conhecimento da IA.

### 🔐 1. Tela de Login
Acesso restrito e seguro para os membros da equipe de TI.
> ![Tela de Login](./assets/login.png)

### 📋 2. Dashboard (Kanban)
Visão geral dos chamados abertos, em atendimento e resolvidos, com suporte a drag-and-drop e insights gerados por IA.
> ![Painel Kanban](./assets/dashboard.png)

### 📚 3. Base de Conhecimento
Interface para upload e gestão de manuais (PDF/Doc) que alimentam o motor de **RAG** do chatbot.
> ![Gestão de Conhecimento](./assets/base-conhecimento.png)

### 📊 4. Relatórios e Métricas
Visualização de dados sobre o volume de atendimentos, tempo médio de resposta e eficiência da IA.
> ![Relatórios](./assets/relatorios.png)

### 🛠️ 5. Equipe de TI
Gestão dos técnicos e administradores que possuem acesso à plataforma.
> ![Equipe de TI](./assets/equipe-ti.png)

### 👥 6. Usuários do Chatbot
Controle e histórico de todos os usuários que já interagiram com o bot via WhatsApp.
> ![Usuários do Chatbot](./assets/usuarios-chatbot.png)

---

## 🛠️ Tech Stack

| Componente | Tecnologia |
| :--- | :--- |
| **Automação de Fluxo** | [n8n](https://n8n.io/) |
| **Integração WhatsApp** | [Evolution API](https://evolution-api.com/) |
| **Banco de Dados & Vetores**| [Supabase](https://supabase.com/) |
| **Frontend Dashboard** | React + Vite (via **Lovable**) |
| **Estilização** | Tailwind CSS + shadcn/ui |
| **Modelos de IA** | OpenAI (GPT-4o Vision / Text-Embedding-3) |

---

Desenvolvido por João Lucas Guimarães
