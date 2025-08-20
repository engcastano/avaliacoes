# Avaliações — App estático (GitHub Pages)

App simples (HTML + CSS + JS puro) para avaliar alunos com colunas organizadas por **aula** (A1, A2, etc.).
Funciona 100% no GitHub Pages — sem backend, sem bibliotecas externas.

## Recursos
- Colunas agrupadas por aula (ex.: *Part A1*, *Modelo A2*, etc.).
- Peso por item (default = 1) e **média ponderada** por aluno.
- Opção **"Faltantes = 0"** para considerar notas ausentes como zero.
- Adição/remoção de aulas e itens direto na UI.
- Adição de alunos e edição inline das notas (0–10, passo 0.1).
- **Autosave** em `localStorage` do navegador.
- **Exportar CSV** e **JSON** / **Importar JSON**.

## Deploy no GitHub Pages
1. Crie um repositório (ou use o existente) e suba estes arquivos na raiz:
   - `index.html`
   - `styles.css`
   - `app.js`
2. Ative GitHub Pages em **Settings → Pages → Deploy from branch** e selecione a branch.
3. Acesse a URL publicada (ex.: `https://seu-usuario.github.io/avaliacoes/`).

> Dica: Não há SPA routing, então não existem problemas de 404. Tudo é uma página só.

## Estrutura de dados (JSON de exportação)
```json
{
  "meta": { "app": "avaliacoes", "version": 1, "exportedAt": "..." },
  "config": {
    "columns": [
      { "id": "abc123", "label": "Part A1", "group": "A1", "weight": 1 }
    ],
    "countZeros": false
  },
  "data": {
    "students": [
      { "id": "s1", "name": "Aluno 1", "grades": { "abc123": 8.5 } }
    ]
  }
}
```

## Sem "loops" de recarregamento
- Não usamos `location.hash` ou redirects. Apenas `localStorage` e eventos locais.
- Zero dependências externas → menos risco de CORS/Mixed Content.
