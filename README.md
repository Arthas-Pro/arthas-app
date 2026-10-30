# THE BOSS — ERP/CRM (Web + Desktop)

Sistema de gestão para produtoras e agências audiovisuais: Dashboard, CRM, Projetos (Kanban/Trello),
Inventário de equipamentos (com leitor de código de barras), Calendário (com Google Agenda),
Financeiro (com importação de extratos PDF/OFX/CSV), Equipe/Freelancers e Suporte.

O mesmo código roda como **site** (Vite/React) e como **app de desktop** (Electron) para Windows e macOS.

## Como o app de desktop funciona

- O app (Electron) abre o sistema oficial em `https://thebosspro.com`. Atualizações do site chegam ao app
  na hora, sem reinstalar, e o login do Google Agenda usa a mesma origem já autorizada do site.
- Sem internet, o app mostra uma tela com o botão **Tentar novamente**.
- Links de WhatsApp, Hotmart e e-mail abrem no navegador/app padrão.

## Servidor (pasta `server/`)

API em Node/Express publicada em `https://api.thebosspro.com`.

- Login gera um token de sessão (válido por 30 dias, até 5 aparelhos por conta).
- Cada usuário só lê e grava os próprios dados.
- Senhas são guardadas com hash (scrypt). Senhas antigas em texto puro são convertidas no próximo login.
- Cadastro manual, logs e teste de e-mail são exclusivos de contas MASTER.
- O `.env` (SMTP e token da Hotmart) fica só no servidor; use `server/.env.example` como modelo.

## Publicar site e servidor

1. Uma única vez: em **Settings → Secrets and variables → Actions → New repository secret**, crie
   `HOSTINGER_SSH_PASSWORD` com a senha SSH da Hostinger.
2. Aba **Actions** → **Publicar site e servidor (Hostinger)** → **Run workflow**.

O fluxo envia a API (sem tocar no `.env`, `storage/` e `data/` do servidor), reinicia o Node e publica o site.

## Baixar os instaladores

Cada alteração do app de desktop enviada para a branch `main` dispara o GitHub Actions (aba **Actions** → *Build Desktop*), que gera:

- `instalador-windows` → `THE-BOSS-ERP-Setup-x.y.z.exe`
- `instalador-macos` → `THE-BOSS-ERP-x.y.z-mac.dmg` (Intel e Apple Silicon)

Para publicar uma versão na página **Releases**: altere `version` no `package.json` e crie uma tag `v1.0.1`, por exemplo.

### Primeira abertura (instaladores sem assinatura digital)

- **Windows:** se aparecer "O Windows protegeu o computador", clique em **Mais informações → Executar assim mesmo**.
- **macOS:** clique com o botão direito no app → **Abrir** → **Abrir**. Em versões novas do macOS:
  **Ajustes do Sistema → Privacidade e Segurança → Abrir mesmo assim**.

## Comandos para desenvolvedores

```bash
npm ci                 # instalar dependências
npm run dev            # site em modo desenvolvimento
npm run build          # build do site (deploy web)
npm run electron       # abrir o app de desktop
npm run dist:win       # gerar instalador .exe (Windows)
npm run dist:mac       # gerar .dmg (precisa de um Mac; use o GitHub Actions)
```
