# 🐱 Minouverse - Twitter-Like Social Platform

> Une plateforme de réseaux sociaux moderne avec chat en temps réel, posts multimédias et abonnements premium.

## 🚀 Installation et Déploiement

### 📥 Cloner le projet (attention bien cloner la branche alex)

```bash
git clone -b alex https://github.com/havenito/Twitter_Like
cd Twitter_Like
```

### 🔧 Configuration du Backend (Flask)

1. **Installer les dépendances**
   ```bash
   cd Flask
   pip install -r requirements.txt
   ```

2. **Lancer le serveur Flask**
   ```bash
   # Option 1 : Avec Flask CLI
   flask run
   
   # Option 2 : Avec Python
   python app.py
   ```

   ✅ Le serveur Flask sera disponible sur `http://localhost:5000`

### 🎨 Configuration du Frontend (Next.js)

1. **Installer les dépendances**
   ```bash
   cd ../Nextjs
   npm install
   ```

2. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

   ✅ L'application sera disponible sur `http://localhost:3000`

## 💳 Configuration Stripe (Optionnel)

> ⚠️ **Prérequis** : Accès au panel Stripe de l'équipe

### 🔗 Configuration ngrok pour les webhooks

1. **Installer ngrok**
   ```bash   
   # Télécharger depuis https://ngrok.com/download
   ```

2. **Exposer le serveur local**
   ```bash
   ngrok http 3000
   ```

3. **Configurer l'URL du webhook**
   - Copier l'URL HTTPS fournie par ngrok
   - L'ajouter dans le dashboard Stripe comme endpoint webhook

## 🛠️ Variables d'environnement

> 🔑 **Important** : Pour obtenir les fichiers `.env` complets, contactez un membre de l'équipe

### 📁 Flask (`.flaskenv`)
```env
FLASK_APP=app.py
FLASK_ENV=development
DATABASE_URL=your_database_url
CLOUDINARY_CLOUD_NAME=your_cloud_name
STRIPE_SECRET_KEY=your_stripe_secret_key
FRONTEND_URL=http://localhost:3000
```

### 📁 Next.js (`.env.local`)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:5000
GOOGLE_CLIENT_ID=your_google_client_id
GITHUB_CLIENT_ID=your_github_client_id
```

## 📦 Technologies utilisées

### Backend
- ![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)
- ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
- ![Socket.IO](https://img.shields.io/badge/Socket.io-black?style=flat&logo=socket.io&badgeColor=010101)
- ![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=flat&logo=Stripe&logoColor=white)

### Frontend
- ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
- ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
- ![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=flat&logo=framer&logoColor=blue)

### Services
- ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
- ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white)
- ![NextAuth.js](https://img.shields.io/badge/NextAuth.js-000000?style=flat&logo=next.js&logoColor=white)

## ✨ Fonctionnalités

- 🔐 **Authentification** - Login/Register avec Google et GitHub
- 📝 **Posts multimédias** - Images, vidéos et texte
- 💬 **Chat en temps réel** - WebSocket avec Socket.IO
- 👥 **Système de followers** - Profils publics/privés
- 💎 **Abonnements premium** - Intégration Stripe
- 📱 **Interface responsive** - Design mobile-first
- 🔍 **Recherche avancée** - Utilisateurs et contenus
- 🛡️ **Panel admin** - Modération et gestion

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème :
- 🐛 Issues : [GitHub Issues](https://github.com/havenito/Twitter_Like/issues)

---

  
**Développé avec ❤️ par l'équipe Minouverse**