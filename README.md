# Programmer's Room

Um "GitHub 2.0" simples e completo rodando em GitHub Pages, com backend de dados via Supabase Edge Function (KV store).

## Estrutura

- `index.html` - Página principal
- `css/styles.css` - Estilos (tema dark moderno)
- `src/scripts/`
  - `api.js` - Cliente da API Supabase KV
  - `auth.js` - Registro, login, captcha, verificação, hash de senha
  - `projects.js` - Lógica de projetos, arquivos, contribuições, limites
  - `app.js` - UI principal, views, eventos

## Como usar

1. Ajuste as constantes em `src/scripts/api.js`:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `API_URL` (coloque o nome correto da sua Edge Function)

2. Faça upload deste projeto no GitHub e ative GitHub Pages (branch main / root).

3. Acesse o site.

## Funcionalidades implementadas

- Criação de conta com:
  - Nickname, avatar (redimensionado), e-mail, GitHub opcional
  - Senha forte (validação contra óbvias)
  - Captcha matemático simples
  - Verificação de código de 8 dígitos (demo: código exibido na tela; em produção enviaria e-mail)
  - Data de nascimento (mínimo 8 anos)
  - Setup de perfil: linguagens, bio, descrição, tags, engine, redes

- Barra superior com busca de projetos
- Menu do usuário
- Barra de ferramentas lateral direita (clique para abrir, clique fora para fechar)
- Criação de projetos (máx. 3 por conta, 2MB cada)
- Editor de arquivos com paleta de temas de cores (Dark, Light, Monokai, Solarized)
- Upload de arquivos do computador
- README com renderização Markdown básica
- Público/Privado
- Downloads (contados por usuário único)
- Likes
- Comentários
- Avaliações (estrelas)
- Sistema de reports
- Insights (views, downloads, likes)
- Local Branches (salvas no localStorage, ilimitadas)
- Sistema de contribuições: Get Local Branch → editar → enviar modificações → dono aprova e mescla (entra nos créditos)

- **Personalização do UI e HUD** (menu dedicado):
  - Temas: Dark, Light, Monokai, Solarized, Dracula, Nord
  - Cor de destaque (color picker)
  - Fonte da interface e fonte do editor de código
  - Densidade (compacta / normal / confortável)
  - Arredondamento e largura da toolbar
  - Opções de HUD (ocultar busca, toolbar discreta)
  - Tudo salvo na conta e aplicado automaticamente

## Linguagens suportadas

Python, JavaScript, TypeScript, Java, C#, C++, C, PHP, Ruby, Swift, Kotlin, Go, SQL, HTML, CSS, Rust, R, JSON, XML, YAML, Shell, Perl, Objective-C, Lua, Assembly, Arduino, Markdown, Compino.

## Notas

- Dados persistidos via a API KV fornecida (todas as chaves começam com `-ProRom_`).
- Segurança é básica (adequada para demo/protótipo). Em produção real, use RLS, tokens, etc.
- Email real não é enviado (sem serviço de e-mail disponível). O código de verificação é mostrado para fins de demonstração.
- Limites de 3 projetos e 2MB por projeto são aplicados.

Divirta-se codando no Programmer's Room!
