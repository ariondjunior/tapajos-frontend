# Sistema Financeiro - Empresa Tapajos Ltda

Sistema completo de gestão financeira desenvolvido em React + TypeScript + Tailwind CSS para informatizar o setor financeiro da empresa.

## 🚀 Funcionalidades

### Cadastros Básicos
- **Clientes e Fornecedores**: Cadastro unificado com dados completos
- **Bancos**: Gestão de contas bancárias e saldos
- **Usuários**: Controle de acesso e permissões

### Controle Financeiro
- **Movimentações Bancárias**: Registro de créditos e débitos
- **Contas a Pagar/Receber**: Gestão de duplicatas com controle de vencimento
- **Pagamento Automático**: Integração entre duplicatas e movimentações bancárias
- **Controle de Saldos**: Atualização automática dos saldos bancários

### Relatórios Gerenciais
- **Previsão de Caixa**: Detalhado e resumido com total do dia
- **Extrato por Cliente**: Valor das duplicatas de cada cliente
- **Extrato por Fornecedor**: Valor das duplicatas de cada fornecedor
- **Extrato Bancário**: Movimentações por banco
- **Auditoria**: Lançamentos efetuados por cada usuário
- **Saldos dos Bancos**: Visão consolidada dos saldos

### Controle de Usuários
- **Auditoria Completa**: Registro de todas as ações dos usuários
- **Controle de Acesso**: Diferentes níveis de permissão
- **Rastreabilidade**: Data e usuário responsável por cada lançamento

## 🛠️ Tecnologias Utilizadas

- **React 18**: Biblioteca para interface de usuário
- **TypeScript**: Tipagem estática para JavaScript
- **Tailwind CSS**: Framework CSS utilitário
- **React Router DOM**: Roteamento de páginas
- **Lucide React**: Ícones modernos
- **Date-fns**: Manipulação de datas
- **Axios**: Cliente HTTP para requisições
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de schemas
- **JWT**: Autenticação e autorização

## 📦 Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd tapajos-financeiro
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp env.example .env
   ```
   
   Edite o arquivo `.env` com a URL da sua API:
   ```
   REACT_APP_API_URL=http://localhost:3001/api
   ```

4. **Execute o projeto**
   ```bash
   npm start
   ```

5. **Acesse no navegador**
   ```
   http://localhost:3000
   ```

## 🔐 Autenticação

O sistema agora possui autenticação completa:

- **Tela de Login**: Interface moderna com validação
- **Proteção de Rotas**: Acesso restrito a usuários autenticados
- **JWT Tokens**: Autenticação segura
- **Logout**: Encerramento de sessão
- **Persistência**: Login mantido entre sessões

### Credenciais de Demonstração
- **Email**: admin@tapajos.com
- **Senha**: 123456

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Layout.tsx      # Layout principal com menu lateral
│   └── ProtectedRoute.tsx # Proteção de rotas
├── contexts/           # Contextos React
│   └── AuthContext.tsx # Contexto de autenticação
├── pages/              # Páginas da aplicação
│   ├── Login.tsx       # Tela de login
│   ├── Dashboard.tsx  # Dashboard principal
│   ├── ClientsSuppliers.tsx
│   ├── Banks.tsx
│   ├── BankTransactions.tsx
│   ├── PayablesReceivables.tsx
│   ├── Reports.tsx
│   └── Users.tsx
├── services/           # Serviços e lógica de negócio
│   ├── index.ts       # Exportações dos serviços
│   ├── apiService.ts  # Serviços HTTP da API
│   └── authService.ts # Serviço de autenticação
├── types/              # Definições TypeScript
│   └── index.ts       # Interfaces e tipos
├── App.tsx            # Componente principal
├── index.tsx          # Ponto de entrada
└── index.css          # Estilos globais
```

## 🎨 Interface

- **Design Moderno**: Interface limpa e profissional
- **Menu Lateral**: Navegação intuitiva com ícones
- **Responsivo**: Adaptável a diferentes tamanhos de tela
- **Tema Consistente**: Cores e tipografia padronizadas
- **Componentes Reutilizáveis**: Botões, formulários e tabelas padronizados

## 📊 Funcionalidades Detalhadas

### Dashboard
- Visão geral dos saldos bancários
- Resumo de contas a pagar e receber
- Previsão de caixa para os próximos 7 dias
- Transações recentes
- Indicadores visuais com cores

### Gestão de Clientes/Fornecedores
- Cadastro unificado com validação
- Busca e filtros avançados
- Edição e exclusão lógica
- Formatação automática de documentos (CPF/CNPJ)

### Controle Bancário
- Cadastro de múltiplas contas bancárias
- Controle de saldos em tempo real
- Movimentações com auditoria completa
- Integração automática com pagamentos

### Duplicatas
- Criação de contas a pagar e receber
- Controle de vencimentos
- Pagamento com atualização automática
- Status visual (pendente, pago, vencida)

### Relatórios
- Exportação para CSV
- Filtros por período e entidade
- Visualização tabular organizada
- Dados em tempo real

## 🔒 Segurança

- **Auditoria Completa**: Todas as ações são registradas
- **Controle de Usuários**: Diferentes níveis de acesso
- **Validação de Dados**: Campos obrigatórios e formatos corretos
- **Exclusão Lógica**: Dados não são removidos fisicamente

## 🔌 Integração com API

O sistema está preparado para se conectar com uma API backend. Consulte o arquivo `API_DOCUMENTATION.md` para detalhes completos dos endpoints necessários.

### Endpoints Principais

- **Autenticação**: `/auth/login`, `/auth/logout`, `/auth/me`
- **Clientes/Fornecedores**: `/clients-suppliers`
- **Bancos**: `/banks`
- **Transações**: `/bank-transactions`
- **Duplicatas**: `/payables-receivables`
- **Relatórios**: `/reports/*`
- **Usuários**: `/users`

### Configuração da API

1. Configure a URL da API no arquivo `.env`
2. Implemente os endpoints conforme documentação
3. Configure autenticação JWT
4. Implemente interceptors para tratamento de erros

## 🚀 Próximos Passos

Para produção, considere implementar:

1. **Backend Completo**: API REST com Node.js/Express
2. **Banco de Dados**: PostgreSQL com Prisma ORM
3. **Notificações**: Alertas de vencimentos
4. **Backup**: Sistema de backup automático
5. **Relatórios Avançados**: Gráficos e análises mais detalhadas
6. **Testes**: Testes unitários e de integração
7. **Deploy**: Docker e CI/CD

## 📝 Licença

Este projeto foi desenvolvido especificamente para a Empresa Tapajos Ltda.

## 👥 Suporte

Para dúvidas ou suporte técnico, entre em contato com a equipe de desenvolvimento.
