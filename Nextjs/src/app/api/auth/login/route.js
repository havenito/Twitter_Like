import { NextResponse } from 'next/server';

// J'ai mis ici un utilisateur codé en dur pour tester le login
const hardcodedUser = {
  email: 'alex.drain0908@gmail.com',
  password: '1234'
};

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    if (email === hardcodedUser.email && password === hardcodedUser.password) {
      const token = 'simulated-valid-token-' + Date.now(); //J'ai crée un token simple ici le temps pour tester
      
      return NextResponse.json({
        message: 'Connexion réussie',
        user: {
          email: hardcodedUser.email,
        },
        token
      });
    } else {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

  } catch (error) {
    console.error('Erreur de connexion:', error);
    return NextResponse.json({ error: 'Une erreur est survenue lors de la connexion' }, { status: 500 });
  }
}