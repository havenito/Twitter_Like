import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SUBSCRIPTION_TYPES = ['free', 'plus', 'premium'];

const RESERVED_PSEUDOS = [
  'login', 'register', 'comment', 'edit-profile', 'favorites', 'followers', 
  'following', 'post', 'reply', 'foryou', 'message', 'home', 'polls', 
  'search', 'premium', 'api', 'auth', 'forgot-password', 'reset-password', 
  'notifications', 'admin', 'user', 'reports', 'dashboard', 'settings',
  'profile', 'about', 'help', 'support', 'contact', 'terms', 'privacy',
  'www', 'mail', 'email', 'ftp', 'blog', 'news', 'static', 'assets',
  'css', 'js', 'img', 'images', 'upload', 'download', 'test', 'demo'
];

function validateSubscriptionType(subscriptionType) {
  if (!SUBSCRIPTION_TYPES.includes(subscriptionType)) {
    throw new Error(`Type d'abonnement invalide: ${subscriptionType}. Valeurs autorisées: ${SUBSCRIPTION_TYPES.join(', ')}`);
  }
  return subscriptionType;
}

function generateValidPseudo(baseEmail) {
  const basePseudo = baseEmail.split('@')[0];
  const normalizedBase = basePseudo.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  
  // Si le pseudo de base est réservé, ajouter un suffixe
  if (RESERVED_PSEUDOS.includes(normalizedBase.toLowerCase())) {
    return `${normalizedBase}${Date.now()}`;
  }
  
  return normalizedBase;
}

function isReservedPseudo(pseudo) {
  return RESERVED_PSEUDOS.includes(pseudo.toLowerCase());
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis.");
        }
        
        const apiUrl = process.env.FLASK_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/login`, {
          method: 'POST',
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
          headers: { "Content-Type": "application/json" }
        });
        const responseData = await res.json();

        if (res.ok && responseData.user) {
          return responseData.user;
        } else {
          throw new Error(responseData.error || "Échec de l'authentification. Veuillez vérifier vos identifiants.");
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (account && user) {
        token.userId = user.id;
        token.userRoles = user.roles;
        token.email = user.email;
        token.firstName = user.first_name;
        token.lastName = user.last_name;
        token.pseudo = user.pseudo;
        token.profilePicture = user.profile_picture;
        token.isPrivate = user.private;
        token.biography = user.biography;
        token.banner = user.banner;
        
        try {
          token.subscription = validateSubscriptionType(user.subscription || 'free');
        } catch (error) {
          console.error('Erreur validation abonnement:', error);
          token.subscription = 'free'; 
        }
      }

      if (trigger === "update" && session?.subscription) {
        try {
          token.subscription = validateSubscriptionType(session.subscription);
          console.log('Token mis à jour avec nouvel abonnement:', token.subscription);
        } catch (error) {
          console.error('Erreur lors de la mise à jour du token:', error);
        }
      }

      return token;
    },
    
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.roles = token.userRoles;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.pseudo = token.pseudo;
      session.user.profilePicture = token.profilePicture;
      session.user.isPrivate = token.isPrivate;
      session.user.biography = token.biography;
      session.user.banner = token.banner;
      session.user.subscription = token.subscription;
      
      if (token.email && !session.user.email) {
        session.user.email = token.email;
      }
      return session;
    },
    
    async signIn({ user, account, profile, email, credentials }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          const defaultSubscription = 'free';
          
          const { data: existingUser, error: userError } = await supabase
            .from('user')
            .select('id, email, first_name, last_name, pseudo, profile_picture, private, roles, subscription')
            .eq('email', user.email)
            .maybeSingle();

          if (userError) {
            console.error('Erreur lors de la vérification de l\'utilisateur dans Supabase:', userError);
            return false;
          }

          if (!existingUser) {
            const nameParts = user.name ? user.name.split(' ') : [];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            
            let generatedPseudo = generateValidPseudo(user.email);
            
            let pseudoCounter = 1;
            let finalPseudo = generatedPseudo;
            
            while (true) {
              const { data: existingPseudo } = await supabase
                .from('user')
                .select('id')
                .eq('pseudo', finalPseudo)
                .maybeSingle();
              
              if (!existingPseudo) break;
              
              finalPseudo = `${generatedPseudo}${pseudoCounter}`;
              pseudoCounter++;
            }

            const { data: newUser, error: insertError } = await supabase
              .from('user')
              .insert([
                {
                  email: user.email,
                  roles: 'user',
                  first_name: firstName,
                  last_name: lastName,
                  profile_picture: user.image || null,
                  private: false,
                  pseudo: finalPseudo,
                  subscription: defaultSubscription
                },
              ])
              .select('id, email, first_name, last_name, pseudo, profile_picture, private, roles, subscription')
              .single();

            if (insertError) {
              console.error('Erreur lors de l\'insertion de l\'utilisateur OAuth dans Supabase:', insertError);
              return false;
            }
            
            if (newUser) {
                user.id = newUser.id;
                user.roles = newUser.roles;
                user.first_name = newUser.first_name;
                user.last_name = newUser.last_name;
                user.pseudo = newUser.pseudo;
                user.profile_picture = newUser.profile_picture;
                user.private = newUser.private;
                user.subscription = newUser.subscription;
            }

          } else {
            user.id = existingUser.id;
            user.roles = existingUser.roles;
            user.first_name = existingUser.first_name;
            user.last_name = existingUser.last_name;
            user.pseudo = existingUser.pseudo;
            user.profile_picture = existingUser.profile_picture;
            user.private = existingUser.private;
            user.subscription = existingUser.subscription;
          }
          return true;
        } catch (error) {
          console.error('Erreur lors de la gestion de la connexion OAuth:', error);
          return false;
        }
      }
      return true;
    },
    
    async redirect({ url, baseUrl }) {
      if (url === "/") {
        return baseUrl + '/'; 
      } else {
        return baseUrl + '/home';
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };