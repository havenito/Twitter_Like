import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials"; // Import CredentialsProvider
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
        // Add logic here to look up the user from the credentials supplied
        // This will call your Flask API
        const res = await fetch(`${process.env.FLASK_API_URL}/api/login`, {
          method: 'POST',
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
          headers: { "Content-Type": "application/json" }
        });
        const responseData = await res.json();

        if (res.ok && responseData.user) {
          // Any object returned will be saved in `user` property of the JWT
          return responseData.user; // Flask should return the user object
        } else {
          // If you return null then an error will be displayed to the user
          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
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
  session: { // Ensure session strategy is JWT
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Persist the user id and role to the token right after signin
      if (account && user) { // User object is available on initial sign-in (credentials or OAuth)
        token.userId = user.id; // Ensure 'id' comes from your Flask user object or Supabase
        token.userRoles = user.roles;
        token.email = user.email;
        token.firstName = user.first_name; // Ensure consistent naming (first_name vs firstName)
        token.lastName = user.last_name;
        token.pseudo = user.pseudo;
        token.profilePicture = user.profile_picture;
        token.isPrivate = user.private; // Ensure 'private' is a boolean
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.user.id = token.userId;
      session.user.roles = token.userRoles;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.pseudo = token.pseudo;
      session.user.profilePicture = token.profilePicture;
      session.user.isPrivate = token.isPrivate;
      // Ensure email is part of the session user if not already
      if (token.email && !session.user.email) {
        session.user.email = token.email;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Vérifier si l'utilisateur existe déjà dans Supabase (ou votre DB via Flask)
          const { data: existingUser, error: userError } = await supabase
            .from('user')
            .select('id, email, first_name, last_name, pseudo, profile_picture, private, roles') // Select specific fields
            .eq('email', user.email)
            .maybeSingle();

          if (userError) {
            console.error('Erreur lors de la vérification de l\'utilisateur dans Supabase:', userError);
            return false; // Empêcher la connexion
          }

          if (!existingUser) {
            // Créer un nouvel utilisateur
            const nameParts = user.name ? user.name.split(' ') : [];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''; // Ensure lastName is a string

            const { data: newUser, error: insertError } = await supabase
              .from('user')
              .insert([
                {
                  email: user.email,
                  // password: '', // Pas de mot de passe pour les connexions OAuth
                  roles: 'user', // Default role
                  first_name: firstName,
                  last_name: lastName,
                  profile_picture: user.image || null, // Use null if no image
                  private: false, // Default privacy
                  pseudo: user.email.split('@')[0] // Default pseudo
                },
              ])
              .select('id, email, first_name, last_name, pseudo, profile_picture, private, roles') // Select fields from the new user
              .single();

            if (insertError) {
              console.error('Erreur lors de l\'insertion de l\'utilisateur OAuth dans Supabase:', insertError);
              return false; // Empêcher la connexion
            }
            // Attach the newly created user's details (matching what authorize would return) to the user object for the jwt callback
            if (newUser) {
                user.id = newUser.id;
                user.roles = newUser.roles;
                user.first_name = newUser.first_name;
                user.last_name = newUser.last_name;
                user.pseudo = newUser.pseudo;
                user.profile_picture = newUser.profile_picture;
                user.private = newUser.private;
            }

          } else {
             // Attach existing user's details to the user object for the jwt callback
            user.id = existingUser.id;
            user.roles = existingUser.roles;
            user.first_name = existingUser.first_name;
            user.last_name = existingUser.last_name;
            user.pseudo = existingUser.pseudo;
            user.profile_picture = existingUser.profile_picture;
            user.private = existingUser.private;
          }
          return true; // Autoriser la connexion OAuth
        } catch (error) {
          console.error('Erreur lors de la gestion de la connexion OAuth:', error);
          return false; // Empêcher la connexion
        }
      }
      return true; // Pour les autres types de connexion (credentials)
    },
    async redirect({ url, baseUrl }) {
      return baseUrl + '/home';
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };