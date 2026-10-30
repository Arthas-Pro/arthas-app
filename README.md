# THE BOSS — ERP/CRM (Web + Desktop)

Sistema de gestão para produtoras e agências audiovisuais: Dashboard, CRM, Projetos (Kanban/Trello),
Inventário de equipamentos (com leitor de código de barras), Calendário (com Google Agenda),
Financeiro (com importação de extratos PDF/OFX/CSV), Equipe/Freelancers e Suporte.

O mesmo código roda como **site** (Vite/React) e como **app de desktop** (Electron) para Windows e macOS.

## Como o app de desktop funciona

- O Electron serve o site compilado (`dist/`) em `http://localhost:47821` dentro do próprio app.
- Login e dados continuam no servidor `https://api.thebosspro.com` (mesma conta do site).
- Links de WhatsApp, Hotmart e e-mail abrem no navegador/app padrão.
- O login do Google Agenda abre numa janela dentro do app.
- Precisa de internet (login, sincronização, fontes e leitor de PDF).

## Baixar os instaladores

Cada envio para a branch `main` dispara o GitHub Actions (aba **Actions** → *Build Desktop*), que gera:

- `instalador-windows` → `THE-BOSS-ERP-Setup-x.y.z.exe`
- `instalador-macos` → `THE-BOSS-ERP-x.y.z-mac.dmg` (Intel e Apple Silicon)

Para publicar uma versão na página **Releases**: altere `version` no `package.json` e crie uma tag `v1.0.1`, por exemplo.

### Primeira abertura (instaladores sem assinatura digital)

- **Windows:** se aparecer "O Windows protegeu o computador", clique em **Mais informações → Executar assim mesmo**.
- **macOS:** clique com o botão direito no app → **Abrir** → **Abrir**. Em versões novas do macOS:
  **Ajustes do Sistema → Privacidade e Segurança → Abrir mesmo assim**.

## Google Agenda no app de desktop

No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), abra o ID do cliente OAuth usado
pelo sistema e adicione em **Origens JavaScript autorizadas**:

```
http://localhost:47821
```

## Comandos para desenvolvedores

```bash
npm ci                 # instalar dependências
npm run dev            # site em modo desenvolvimento
npm run build          # build do site (deploy web)
npm run electron       # abrir o app de desktop localmente
npm run dist:win       # gerar instalador .exe (Windows)
npm run dist:mac       # gerar .dmg (precisa de um Mac; use o GitHub Actions)
```
