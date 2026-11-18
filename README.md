# ADECOAGRO MINING CLOUD — starter v2

Aplicação inicial React + Vite + Supabase para relatórios operacionais.

## Antes de publicar
Este é um starter de implementação, não um serviço já hospedado nem uma versão auditada para produção. É necessário configurar Supabase, OAuth Google, variáveis de ambiente e testar as regras de acesso.

## 1. Supabase
1. Crie um projeto Supabase.
2. Abra SQL Editor e execute `supabase/schema.sql`.
3. Em Authentication → Providers, configure Google OAuth.
4. Configure a URL de callback do Supabase no cliente OAuth do Google.
5. Em Authentication → URL Configuration, defina Site URL e Redirect URLs com o domínio Vercel depois do primeiro deploy.
6. Em Project Settings → API, copie Project URL e a chave publishable (ou anon legacy).

## 2. Variáveis
Copie `.env.example` para `.env` e preencha:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Nunca use `service_role` no frontend nem envie secrets para GitHub.

## 3. Rodar localmente
```bash
npm install
npm run dev
```

## 4. GitHub e Vercel
Suba o conteúdo desta pasta para a raiz do repositório GitHub `adecoagro-mining-cloud`. Depois, em Vercel, importe o repositório. Framework preset: Vite; Build command: `npm run build`; Output directory: `dist`. Cadastre as duas variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em Vercel antes de concluir o deploy.

## Segurança e limites
- O email administrador está definido no frontend/SQL como `klarethsolarte@gmail.com`; confirme que essa é a conta Google correta antes do primeiro login.
- A rotina de cadastro limita a 9 perfis de operador registrados. Perfis bloqueados também contam para esse limite; ajuste a regra se desejar liberar vagas após bloqueio.
- O trigger cria o perfil quando o usuário se registra depois da instalação do SQL. Se o administrador já se registrou antes, será necessário provisionar seu perfil manualmente com uma operação administrativa segura.
- Antes de uso real, revise e teste RLS, limite de usuários, aprovação/bloqueio, auditoria e recuperação de acesso com contas de teste.
- O exportador PDF/JPG e a interface são uma base funcional inicial; revise identidade visual, textos e requisitos operacionais antes de produção.
