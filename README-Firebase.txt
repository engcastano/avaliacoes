# Firebase v6.3 — Como publicar (GitHub Pages)

1) Crie o projeto no Firebase e copie o "firebaseConfig" do App Web (</>).
   - Authentication → habilite "Email/Password".
   - Firestore → crie o DB (produção) e use as regras abaixo.

2) Abra index.html e COLE o firebaseConfig no bloco indicado.

3) Faça upload destes arquivos na raiz do repositório:
   - index.html
   - manifest.json
   - sw.js
   - icons/icon-192.png
   - icons/icon-512.png
   - .gitattributes

4) Settings → Pages → Deploy from a branch → main / (root).

## Regras de Firestore (básicas)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && (request.auth.uid == uid
            || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    match /states/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}

- ADMIN_ALLOWLIST já contém "engcastano@gmail.com" para começar como admin.
- Resets de senha são sempre por e-mail (padrão do Firebase Auth).

## PWA (iPhone/Android/PC)
- Já configurado: manifest + service worker + ícones.
- Em iPhone (Safari): Compartilhar → Adicionar à Tela de Início.
