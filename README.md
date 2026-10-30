# THE BOSS — ERP/CRM (uso pessoal, desktop)

Sistema de gestão para produtora audiovisual: Visão Panorâmica (dashboard), CRM, Projetos (Kanban/Trello),
Inventário de equipamentos (com leitor de código de barras), Calendário (com Google Agenda opcional),
Financeiro (com importação de extratos PDF/OFX/CSV) e Equipe/Freelancers.

Aplicativo de desktop (Electron) para Windows e macOS, **100% local**: sem login, sem servidor,
funciona sem internet.

## Onde ficam os dados

Cada módulo é salvo como um arquivo JSON na pasta do app:

- **Windows:** `%APPDATA%\THE BOSS ERP\dados`
- **macOS:** `~/Library/Application Support/THE BOSS ERP/dados`

O app também guarda um **backup automático por dia** (últimos 14) em `backups-automaticos`.
Desinstalar o app **não** apaga os dados.

Menu **Arquivo**:

- **Fazer backup dos dados…** (Ctrl/Cmd+S): salva tudo num único arquivo `.json`.
- **Restaurar backup…**: aceita um backup do app ou os arquivos soltos `clientes.json`, `projetos.json`…
  (por exemplo, os da pasta `data/<id>` do antigo servidor). Antes de restaurar, os dados atuais são copiados
  para os backups automáticos.
- **Abrir pasta dos dados**.

## Áreas restritas

Os módulos são protegidos por uma senha secundária, criada no primeiro acesso e alterável em
**Perfil → Mudar Senha Secundária**.

## Baixar os instaladores

Cada envio para a branch `main` dispara o GitHub Actions (aba **Actions** → *Build Desktop*), que gera:

- `instalador-windows` → `THE-BOSS-ERP-Setup-x.y.z.exe`
- `instalador-macos` → `THE-BOSS-ERP-x.y.z-mac.dmg` (Intel e Apple Silicon)

### Primeira abertura (instaladores sem assinatura digital)

- **Windows:** se aparecer "O Windows protegeu o computador", clique em **Mais informações → Executar assim mesmo**.
- **macOS:** clique com o botão direito no app → **Abrir** → **Abrir**. Em versões novas do macOS:
  **Ajustes do Sistema → Privacidade e Segurança → Abrir mesmo assim**.

## Google Agenda (opcional)

A sincronização usa o login do Google. Para funcionar no app, no
[Google Cloud Console](https://console.cloud.google.com/apis/credentials) abra o ID do cliente OAuth usado
pelo sistema e adicione em **Origens JavaScript autorizadas**:

```
http://localhost:47821
```

## Comandos para desenvolvedores

```bash
npm ci                 # instalar dependências
npm run dev            # interface no navegador (dados no localStorage)
npm run electron       # abrir o app de desktop
npm run dist:win       # gerar instalador .exe (Windows)
npm run dist:mac       # gerar .dmg (precisa de um Mac; use o GitHub Actions)
```
