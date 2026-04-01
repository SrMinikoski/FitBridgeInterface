# Implementação: Campo de Imagem no Cadastro de Treino

## Resumo
Adicionado campo para upload de imagem no formulário de cadastro de treino, exatamente como implementado no cadastro de exercício. A imagem é salva localmente no servidor e apenas o diretório é armazenado no banco de dados.

## Alterações no Front-end (Angular)

### 1. HTML (cadastro-treino.html)
- Adicionada seção `workout-image-section` antes de `workout-details`
- Campo de input para seleção de arquivo de imagem
- Preview da imagem selecionada
- Suporta formatos: JPG, PNG, AVIF

### 2. CSS (cadastro-treino.css)
- Adicionados estilos para `.workout-image-section`
- Estilos para `.image-preview` (área de preview com borda tracejada)
- Validação visual com feedback ao usuário

### 3. TypeScript (cadastro-treino.ts)
**Propriedades adicionadas:**
```typescript
nomeImagem: string = '';
imagemPreview: string | null = null;
arquivoImagem: File | null = null;
```

**Método adicionado:**
- `onImageSelect(event: Event)` - Processa a imagem selecionada e gera preview

**Métodos modificados:**
- `saveWorkout()` - Agora:
  1. Valida se uma imagem foi selecionada
  2. Faz upload da imagem via `/api/upload-workout-image`
  3. Recebe o caminho (filePath) da imagem
  4. Inclui `diretorioImagem` no DTO antes de enviar para a API
  5. Salva o treino com referência à imagem

- `limparFormulario()` - Também limpa propriedades de imagem

## Alterações no Back-end (Java/Spring Boot)

### 1. Entidade Treino (Treino.java)
- Adicionado campo: `private String diretorioImagem;`
- Adicionados getter/setter para `diretorioImagem`

### 2. DTO (TreinoDTO.java)
- Adicionado campo: `private String diretorioImagem;`
- Adicionados getter/setter correspondentes

### 3. Controller (TreinoController.java)
- Método `create()` - Agora seta `diretorioImagem` do DTO na entidade
- Método `createBulk()` - Agora seta `diretorioImagem` do DTO na entidade

### 4. Express SSR (server.ts) - ✅ JÁ EXISTENTE
- Rota POST `/api/upload-workout-image` já configurada
- Salva arquivos em `public/workouts/`
- Retorna path relativo da imagem

## Fluxo de Execução

1. Usuário seleciona uma imagem no campo "Selecionar imagem"
2. A imagem é processada e exibida como preview
3. Usuário preenche os demais campos do formulário
4. Ao clicar em "Salvar Treino":
   - Validação de imagem obrigatória
   - Upload da imagem para `public/workouts/`
   - Recebimento do path da imagem (ex: `workouts/minha-imagem.jpg`)
   - Envio do treino com o `diretorioImagem` para a API
   - Persistência no banco de dados

## Caminho das Imagens
- **Upload**: `public/workouts/`
- **Armazenado no BD**: Path relativo (ex: `workouts/imagem.jpg`)
- **Acesso via URL**: `/workouts/imagem.jpg`

## Validações
- ✅ Imagem obrigatória (não permite cadastro sem imagem)
- ✅ Formatos aceitos: JPG, PNG, AVIF
- ✅ Preview em tempo real
- ✅ Feedback visual de sucesso/erro

## Testes Recomendados

1. Verificar se a pasta `public/workouts/` é criada automaticamente
2. Testar upload com diferentes formatos de imagem
3. Verificar se a imagem é salva corretamente no servidor
4. Verificar se o path é armazenado corretamente no BD
5. Testar visualização da imagem do treino na listagem (se houver)
