import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const authOptions = {
  providers: [
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
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        // Vérifier si l'utilisateur existe déjà dans Supabase
        const { data: existingUser, error: userError } = await supabase
          .from('user')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (userError) {
          console.error('Erreur lors de la vérification de l\'utilisateur dans Supabase:', userError);
          return false; // Empêcher la connexion
        }

        if (!existingUser) {
          // Créer un nouvel utilisateur dans Supabase
          const nameParts = user.name ? user.name.split(' ') : [];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

          const { error: insertError } = await supabase
            .from('user')
            .insert([
              {
                email: user.email,
                password: '', // Pas de mot de passe pour les connexions OAuth
                roles: 'user',
                first_name: firstName,
                last_name: lastName, 
                profile_picture: user.image || '',
                private: false
              },
            ]);

          if (insertError) {
            console.error('Erreur lors de l\'insertion de l\'utilisateur dans Supabase:', insertError);
            return false; // Empêcher la connexion
          }
        }

        return true; // Autoriser la connexion
      } catch (error) {
        console.error('Erreur lors de la gestion de la connexion:', error);
        return false; // Empêcher la connexion
      }
    },
    async redirect({ url, baseUrl }) {
      return baseUrl + '/home';
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };