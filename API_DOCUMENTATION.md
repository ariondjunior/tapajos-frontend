# API Documentation - Sistema Financeiro Tapajos

Esta documentação descreve os endpoints necessários para o backend do Sistema Financeiro.

## Base URL
```
http://localhost:3001/api
```

## Autenticação
Todas as rotas protegidas requerem o header:
```
Authorization: Bearer <token>
```

## Endpoints

### Autenticação

#### POST /auth/login
Login do usuário
```json
{
  "email": "admin@tapajos.com",
  "password": "123456"
}
```

**Resposta:**
```json
{
  "user": {
    "id": "1",
    "name": "Administrador",
    "email": "admin@tapajos.com",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isActive": true
  },
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

#### POST /auth/logout
Logout do usuário

#### GET /auth/me
Obter dados do usuário atual

#### POST /auth/refresh
Renovar token de acesso
```json
{
  "refreshToken": "refresh_token_here"
}
```

### Clientes/Fornecedores

#### GET /clients-suppliers
Listar todos os clientes e fornecedores

#### GET /clients-suppliers/:id
Obter cliente/fornecedor por ID

#### POST /clients-suppliers
Criar novo cliente/fornecedor
```json
{
  "name": "Cliente Exemplo",
  "document": "12.345.678/0001-90",
  "email": "cliente@exemplo.com",
  "phone": "(11) 99999-9999",
  "address": "Rua Exemplo, 123",
  "type": "client",
  "createdBy": "user_id"
}
```

#### PUT /clients-suppliers/:id
Atualizar cliente/fornecedor

#### DELETE /clients-suppliers/:id
Excluir cliente/fornecedor

### Bancos

#### GET /banks
Listar todos os bancos

#### GET /banks/:id
Obter banco por ID

#### POST /banks
Criar novo banco
```json
{
  "name": "Banco do Brasil",
  "code": "001",
  "accountNumber": "12345-6",
  "agency": "1234",
  "currentBalance": 50000
}
```

#### PUT /banks/:id
Atualizar banco

#### PATCH /banks/:id/balance
Atualizar saldo do banco
```json
{
  "amount": 1000,
  "type": "credit"
}
```

#### DELETE /banks/:id
Excluir banco

### Transações Bancárias

#### GET /bank-transactions
Listar todas as transações

#### GET /bank-transactions?bankId=:id
Listar transações por banco

#### POST /bank-transactions
Criar nova transação
```json
{
  "bankId": "bank_id",
  "type": "credit",
  "amount": 1000,
  "description": "Depósito",
  "date": "2024-01-01T00:00:00.000Z",
  "userId": "user_id",
  "relatedDocumentId": "document_id"
}
```

### Contas a Pagar/Receber

#### GET /payables-receivables
Listar todas as duplicatas

#### GET /payables-receivables?clientSupplierId=:id
Listar duplicatas por cliente/fornecedor

#### POST /payables-receivables
Criar nova duplicata
```json
{
  "clientSupplierId": "client_id",
  "type": "payable",
  "amount": 1000,
  "dueDate": "2024-01-01T00:00:00.000Z",
  "description": "Serviços prestados",
  "status": "pending",
  "userId": "user_id"
}
```

#### PUT /payables-receivables/:id
Atualizar duplicata

#### PATCH /payables-receivables/:id/pay
Pagar duplicata
```json
{
  "paidAmount": 1000,
  "bankId": "bank_id"
}
```

#### DELETE /payables-receivables/:id
Excluir duplicata

### Relatórios

#### GET /reports/dashboard
Dados do dashboard
```json
{
  "totalReceivables": 50000,
  "totalPayables": 30000,
  "bankBalances": [
    {
      "bankName": "Banco do Brasil",
      "balance": 100000
    }
  ],
  "cashFlowProjection": [...],
  "recentTransactions": [...]
}
```

#### GET /reports/cash-flow?days=30
Previsão de caixa
```json
[
  {
    "date": "2024-01-01T00:00:00.000Z",
    "totalInflow": 10000,
    "totalOutflow": 5000,
    "netFlow": 5000,
    "cumulativeBalance": 105000
  }
]
```

#### GET /reports/client-extract/:id
Extrato por cliente

#### GET /reports/supplier-extract/:id
Extrato por fornecedor

#### GET /reports/bank-statement/:id
Extrato bancário por banco

#### GET /reports/user-audit/:id
Auditoria por usuário

#### GET /reports/user-audit
Auditoria geral

### Usuários

#### GET /users
Listar todos os usuários

#### GET /users/:id
Obter usuário por ID

#### POST /users
Criar novo usuário
```json
{
  "name": "Novo Usuário",
  "email": "usuario@exemplo.com",
  "role": "user",
  "isActive": true
}
```

#### PUT /users/:id
Atualizar usuário

#### DELETE /users/:id
Excluir usuário

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autorizado
- `403` - Proibido
- `404` - Não encontrado
- `500` - Erro interno do servidor

## Exemplo de Implementação Backend

### Node.js + Express + Prisma

```javascript
// Estrutura básica de um endpoint
app.get('/api/clients-suppliers', authenticateToken, async (req, res) => {
  try {
    const clientsSuppliers = await prisma.clientSupplier.findMany({
      where: { isActive: true }
    });
    res.json(clientsSuppliers);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
```

### Middleware de Autenticação

```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};
```

## Banco de Dados

### Tabelas Principais

1. **users** - Usuários do sistema
2. **client_suppliers** - Clientes e fornecedores
3. **banks** - Contas bancárias
4. **bank_transactions** - Movimentações bancárias
5. **payables_receivables** - Contas a pagar/receber
6. **user_audits** - Log de auditoria

### Relacionamentos

- `bank_transactions.bankId` → `banks.id`
- `bank_transactions.userId` → `users.id`
- `payables_receivables.clientSupplierId` → `client_suppliers.id`
- `payables_receivables.userId` → `users.id`
- `user_audits.userId` → `users.id`

## Segurança

1. **JWT Tokens** - Para autenticação
2. **Refresh Tokens** - Para renovação de acesso
3. **Validação de Dados** - Usar bibliotecas como Joi ou Yup
4. **Rate Limiting** - Limitar requisições por IP
5. **CORS** - Configurar adequadamente
6. **HTTPS** - Em produção

## Deploy

### Variáveis de Ambiente Necessárias

```env
DATABASE_URL=postgresql://user:password@localhost:5432/tapajos_financeiro
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
PORT=3001
NODE_ENV=production
```
