# Sistema de Cardápio Digital Multi-Loja

Sistema completo de cardápio digital desenvolvido com React, Vite, Shadcn UI e Supabase, projetado para lanchonetes que oferecem delivery.

## 🚀 Funcionalidades

### Para Administradores da Loja

- **Dashboard com KPIs**: Visualize métricas de vendas, pedidos, clientes e ticket médio
- **Gerenciamento da Loja**: Edite informações como nome, logo, WhatsApp e endereço
- **Cardápio Digital**: CRUD completo de produtos com categorias, fotos e preços
- **Gestão de Clientes**: Lista de clientes com histórico de pedidos e filtros
- **Zonas de Entrega**: Configure raios de entrega com taxas específicas por distância
- **Validação Automática**: Bloqueio de pedidos fora das zonas configuradas

### Para Clientes

- **Cardápio Público**: Acesso via link exclusivo da loja (/{slug-da-loja})
- **Carrinho Persistente**: Itens salvos mesmo ao sair e voltar
- **Sistema de Pedidos**: Finalização com validação de endereço e raio de entrega
- **Área do Cliente**: Perfil editável e histórico completo de pedidos
- **Contato Direto**: Botão de WhatsApp para falar com o restaurante

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Shadcn UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **Autenticação**: Supabase Auth
- **Roteamento**: React Router DOM
- **Notificações**: Sonner

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd MVP-FLOW-Projeto
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
# Copie o arquivo .env.example
cp .env.example .env.local

# Edite o .env.local com suas credenciais do Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

4. O banco de dados já foi configurado com todas as tabelas e políticas RLS necessárias no Supabase.

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **stores**: Dados das lojas (nome, slug, logo, contatos, endereço)
- **profiles**: Perfis de usuários (nome, CPF, telefone, endereço)
- **products**: Produtos do cardápio (nome, descrição, preço, categoria, imagem)
- **delivery_zones**: Zonas de entrega (raio em km, taxa de entrega)
- **carts**: Carrinhos de compras
- **cart_items**: Itens no carrinho
- **orders**: Pedidos realizados
- **order_items**: Itens dos pedidos

### Segurança (RLS)

- Admins acessam apenas dados da própria loja
- Clientes acessam apenas próprios pedidos e carrinhos
- Cardápio público acessível sem autenticação

## 🗺️ Estrutura de Rotas

### Públicas
- `/login` - Login universal
- `/cadastro` - Cadastro de cliente
- `/:storeSlug` - Cardápio público da loja
- `/:storeSlug/carrinho` - Carrinho de compras

### Protegidas (Cliente)
- `/:storeSlug/checkout` - Finalizar pedido
- `/perfil` - Área do cliente
- `/perfil/pedidos` - Histórico de pedidos

### Protegidas (Admin)
- `/admin/setup` - Primeira configuração da loja
- `/admin/dashboard` - Dashboard com KPIs
- `/admin/loja` - Configurações da loja
- `/admin/cardapio` - Gerenciar produtos
- `/admin/clientes` - Lista e gerenciamento de clientes
- `/admin/entregas` - Configurar zonas de entrega

## 🎯 Como Usar

### Primeiro Acesso (Admin)

1. Crie uma conta em `/cadastro`
2. Acesse `/admin/setup` para configurar sua loja
3. Configure as zonas de entrega em `/admin/entregas`
4. Adicione produtos ao cardápio em `/admin/cardapio`
5. Compartilhe o link `/{seu-slug}` com os clientes

### Cliente

1. Acesse o link da loja (ex: `/minha-lanchonete`)
2. Navegue pelo cardápio e adicione produtos ao carrinho
3. Faça login ou cadastre-se
4. Finalize o pedido informando o endereço de entrega
5. Acompanhe seus pedidos em `/perfil/pedidos`

## 📱 Recursos Adicionais

- Design responsivo (mobile-first)
- Modo de pagamento: Na entrega (pode ser expandido)
- Validação automática de raio de entrega
- Notificações toast para feedback do usuário
- Botão flutuante do carrinho (mobile)
- Integração com WhatsApp para contato

## 🔐 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) em todas as tabelas
- Validação de dados no frontend e backend
- Proteção de rotas por tipo de usuário

## 🚧 Melhorias Futuras

- Integração com gateway de pagamento (PIX, cartão)
- Sistema de notificações em tempo real
- Cálculo de distância real usando API de geolocalização
- Upload de imagens direto para Supabase Storage
- Sistema de avaliações e comentários
- Relatórios e gráficos avançados
- App mobile (React Native)

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ usando as melhores práticas de desenvolvimento web.
