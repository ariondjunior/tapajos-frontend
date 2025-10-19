# 🚀 Como Testar o Sistema Financeiro

## ✅ Problema Resolvido!

O problema de login foi corrigido. Agora o sistema usa dados mockados para demonstração, permitindo que você teste todas as funcionalidades sem precisar de um backend.

## 🔐 Credenciais de Teste

### Administrador
- **Email**: `admin@tapajos.com`
- **Senha**: `123456`

### Usuário Comum
- **Email**: `user@tapajos.com`
- **Senha**: `123456`

## 📋 Passos para Testar

1. **Execute o projeto**:
   ```bash
   npm start
   ```

2. **Acesse**: `http://localhost:3000`

3. **Faça login** com uma das credenciais acima

4. **Teste as funcionalidades**:
   - ✅ Dashboard com dados de exemplo
   - ✅ Cadastro de clientes/fornecedores
   - ✅ Gestão de bancos
   - ✅ Movimentações bancárias
   - ✅ Contas a pagar/receber
   - ✅ Relatórios gerenciais
   - ✅ Controle de usuários
   - ✅ Auditoria de ações

## 🎯 Dados de Exemplo Incluídos

O sistema já vem com dados de exemplo:

- **2 Usuários**: Admin e Usuário comum
- **2 Clientes/Fornecedores**: Cliente Exemplo Ltda e Fornecedor ABC S/A
- **2 Bancos**: Banco do Brasil e Caixa Econômica Federal
- **2 Transações**: Depósito inicial e pagamento
- **2 Duplicatas**: Uma a receber e uma a pagar
- **Logs de Auditoria**: Ações registradas

## 🔄 Como Funciona

- **Dados Mockados**: Todos os dados são armazenados em memória
- **Simulação de API**: Delay de 500ms-1000ms para simular requisições reais
- **Persistência**: Dados mantidos durante a sessão do navegador
- **Auditoria**: Todas as ações são registradas automaticamente

## 🚀 Próximos Passos

Quando estiver pronto para usar com uma API real:

1. **Implemente o backend** conforme `API_DOCUMENTATION.md`
2. **Altere o arquivo** `src/services/index.ts`:
   ```typescript
   // De:
   export * from './mockService';
   
   // Para:
   export * from './apiService';
   ```
3. **Configure a URL da API** no arquivo `.env`

## 🐛 Solução de Problemas

### Login não funciona
- ✅ Verifique se está usando as credenciais corretas
- ✅ Certifique-se de que o projeto está rodando (`npm start`)
- ✅ Limpe o cache do navegador se necessário

### Dados não aparecem
- ✅ Os dados são carregados com delay simulado
- ✅ Aguarde alguns segundos para os dados aparecerem
- ✅ Verifique o console do navegador para erros

### Erro de compilação
- ✅ Execute `npm install` para instalar dependências
- ✅ Verifique se todas as dependências estão instaladas
- ✅ Reinicie o servidor de desenvolvimento

## 📞 Suporte

Se encontrar algum problema:
1. Verifique o console do navegador (F12)
2. Verifique se todas as dependências estão instaladas
3. Reinicie o servidor de desenvolvimento
4. Limpe o cache do navegador

---

**🎉 Agora você pode testar o sistema completo!**
