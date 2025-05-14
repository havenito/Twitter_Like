import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    // Appel à l'API Flask pour la connexion
    const flaskApiResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    let flaskApiData;
    try {
      // Essayer de parser la réponse JSON
      flaskApiData = await flaskApiResponse.json();
    } catch (e) {
      // Gérer les cas où Flask renvoie une réponse non-JSON ou vide en cas d'erreur
      if (!flaskApiResponse.ok) {
        console.error('Erreur API Flask (réponse non-JSON ou vide):', flaskApiResponse.status, flaskApiResponse.statusText);
        return NextResponse.json(
          { error: `Erreur du service d'authentification: ${flaskApiResponse.statusText || 'Réponse invalide du serveur'}` },
          { status: flaskApiResponse.status || 500 }
        );
      }
      // Si la réponse était ok mais le JSON est invalide (ne devrait pas arriver si Flask répond correctement)
      console.error('Réponse JSON invalide de l\'API Flask pour une requête de connexion réussie:', e);
      return NextResponse.json(
        { error: 'Réponse invalide du service d\'authentification après une opération réussie.' },
        { status: 500 }
      );
    }

    if (!flaskApiResponse.ok) {
      // Propager l'erreur de l'API Flask, en utilisant le message d'erreur de Flask si disponible
      return NextResponse.json(
        { error: flaskApiData.error || 'Échec de la connexion via le service externe.' },
        { status: flaskApiResponse.status }
      );
    }

    // Connexion réussie via Flask, renvoyer les données reçues (message, user, token)
    return NextResponse.json({
      message: flaskApiData.message || 'Connexion réussie',
      user: flaskApiData.user, // L'objet utilisateur renvoyé par Flask
      token: flaskApiData.token // Le token JWT renvoyé par Flask
    }, { status: flaskApiResponse.status });

  } catch (error) {
    // Erreur générale du serveur Next.js (ex: problème de réseau avant l'appel fetch)
    console.error('Erreur interne dans /api/auth/login:', error);
    return NextResponse.json({ error: 'Une erreur interne est survenue lors de la connexion.' }, { status: 500 });
  }
}
