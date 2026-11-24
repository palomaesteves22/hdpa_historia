# Manual de deploy na Vercel com Supabase

Este projeto tem um frontend Vite em `frontend/frontend` e uma API Express em
`backend`. O banco usado pela API é PostgreSQL, que pode ser hospedado no
Supabase. Para manter a configuração simples, publique frontend e API como
dois projetos Vercel separados.

## 1. Prepare o banco no Supabase

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No painel do projeto, abra **SQL Editor** e execute o script de criação do
   schema usado pela aplicação. Este repositório não contém migrações SQL.
   Preserve os nomes das tabelas e colunas referenciados em
   `backend/src/models/questoesModels.js`:
   `questoes`, `vestibular`, `topicos` e `alternativa`.
3. Importe os dados das questões para essas tabelas e confirme que os
   relacionamentos estão preenchidos.
4. Em **Project Settings → Database → Connect**, copie a string de conexão
   PostgreSQL do **Transaction pooler**. Use essa conexão para a API serverless
   da Vercel e guarde a senha em local seguro.

> O schema precisa existir antes de testar `/questoes`; a aplicação não cria
> automaticamente as tabelas nem importa dados.

## 2. Prepare a conexão PostgreSQL

O arquivo `backend/src/config/databese.js` atualmente usa variáveis individuais
(`DB_HOST`, `DB_USER` etc.) e não configura TLS. Para usar a string do Supabase
na Vercel, substitua seu conteúdo por:

```js
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('A variável DATABASE_URL não foi configurada.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
```

Na Vercel, configure `DATABASE_URL` com a string do pooler. Não coloque aspas
em volta do valor e não publique essa string no frontend.

## 3. Prepare as URLs da API no frontend

As telas atualmente chamam `http://localhost:3000`, que só funciona na máquina
de desenvolvimento. Antes de publicar:

1. Crie, por exemplo, `frontend/frontend/src/api.js`:

   ```js
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

   export default API_URL;
   ```

2. Em `Login.jsx`, `HomeSimulado.jsx` e `PaginaQuestoes.jsx`, importe
   `API_URL` usando o caminho relativo adequado e substitua as URLs fixas:

   ```js
   fetch(`${API_URL}/auth/login`, options);
   fetch(`${API_URL}/questoes/enem?${queryParams}`, options);
   ```

   Mantenha os métodos, cabeçalhos e corpos de cada requisição existentes.
3. Depois de criar o projeto da API na Vercel, defina `VITE_API_URL` no projeto
   do frontend com a URL pública da API, sem barra final, por exemplo
   `https://minha-api.vercel.app`.

Variáveis `VITE_*` são incluídas no bundle do navegador. Use essa variável
somente para a URL pública da API; nunca coloque nela senhas, tokens privados
ou a conexão do banco.

## 4. Publique a API na Vercel

1. Envie as alterações para um repositório Git conectado à Vercel.
2. Na Vercel, crie um projeto e importe o repositório.
3. Configure **Root Directory** como `backend`. O ponto de entrada Express é
   `app.js`; mantenha a configuração de `backend/vercel.json`.
4. Em **Settings → Environment Variables**, cadastre:

   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | String de conexão do Transaction pooler Supabase |
   | `JWT_SECRET` | Segredo aleatório, longo e exclusivo para produção |
   | `AUTH_USER` | Usuário administrativo escolhido por você |
   | `AUTH_PASSWORD` | Senha forte para esse usuário |

   Cadastre-as nos ambientes necessários (**Production**, **Preview** e/ou
   **Development**). Não reutilize os valores de desenvolvimento.
5. Faça o deploy e copie o domínio atribuído à API.

O login atual valida `AUTH_USER` e `AUTH_PASSWORD` por variáveis de ambiente;
ele não consulta uma tabela de usuários no Supabase.

## 5. Publique o frontend na Vercel

1. Crie outro projeto Vercel usando o mesmo repositório.
2. Configure **Root Directory** como `frontend/frontend` e confirme o framework
   **Vite**. O build é `npm run build` e a pasta de saída é `dist`.
3. Cadastre `VITE_API_URL` com o domínio da API publicado na etapa anterior.
4. Faça o deploy. Se essa variável for alterada mais tarde, gere um novo
   deploy para reconstruir o bundle.

## 6. Verifique a publicação

1. Abra o domínio do frontend e confira se a página inicial carrega.
2. Teste o login com as credenciais definidas em `AUTH_USER` e
   `AUTH_PASSWORD`; uma resposta válida deve incluir um token.
3. Abra as ferramentas do navegador (**Network**) e confira se as requisições
   vão ao domínio da API, não a `localhost`.
4. Teste a busca de questões e verifique no painel da Vercel os logs da
   função da API caso ocorra erro de conexão ou de schema.

## Segurança e solução de problemas

- Não envie `.env` ao Git nem compartilhe `DATABASE_URL`, senhas ou `JWT_SECRET`.
  Configure segredos somente nas variáveis de ambiente da Vercel.
- Se alguma credencial real já foi publicada ou compartilhada, revogue-a e
  gere outra no Supabase/Vercel.
- Erro de conexão PostgreSQL: confira se `DATABASE_URL` é a string do pooler,
  se a senha está correta e se o código habilita TLS.
- Erro ao buscar questões: confirme a existência das quatro tabelas e dos
  campos/relacionamentos esperados pelo modelo.
- Erro de rede no navegador: confira `VITE_API_URL`, o deploy mais recente do
  frontend e os logs da API.
