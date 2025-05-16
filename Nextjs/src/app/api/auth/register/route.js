import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName') || null; 
    const email = formData.get('email');
    const pseudo = formData.get('pseudo');
    const password = formData.get('password');
    const isPublic = formData.get('isPublic') === 'true';

    if (!firstName || !email || !pseudo || !password) { 
      return NextResponse.json({ 
        error: 'Les champs prénom, email, pseudo et mot de passe sont obligatoires' 
      }, { status: 400 });
    }
    
    const flaskApiResponse = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        roles: 'user', 
        first_name: firstName,
        last_name: lastName,
        profile_picture: null, 
        private: !isPublic,
        pseudo
      }),
    });
    
    let flaskApiData;
    try {
      // Essayer de parser la réponse JSON, qu'elle soit OK ou une erreur JSON de Flask
      flaskApiData = await flaskApiResponse.json();
    } catch (e) {
      if (!flaskApiResponse.ok) {
        console.error('Erreur API Flask (réponse non-JSON ou vide):', flaskApiResponse.status, flaskApiResponse.statusText);
        return NextResponse.json(
          { error: `Erreur du service utilisateur: ${flaskApiResponse.statusText || 'Réponse invalide du serveur'}` },
          { status: flaskApiResponse.status || 500 }
        );
      }
      console.error('Réponse JSON invalide de l\'API Flask pour une requête réussie:', e);
      return NextResponse.json(
        { error: 'Réponse invalide du service utilisateur après une opération réussie.' },
        { status: 500 } 
      );
    }
    
    if (!flaskApiResponse.ok) {
      return NextResponse.json(
        { error: flaskApiData.error || 'Une erreur est survenue lors de la communication avec le service utilisateur.' },
        { status: flaskApiResponse.status } // Propager le statut de Flask
      );
    }
    
    // L'appel à l'API Flask a réussi (ex: statut 201)
    return NextResponse.json(
      { success: true, message: flaskApiData.message || 'Inscription réussie. Veuillez vous connecter.' },
      { status: flaskApiResponse.status } // Propager le statut de succès de Flask
    );
    
  } catch (error) {
    console.error('Erreur interne dans /api/auth/register (avant ou pendant l\'appel fetch, ou erreur non gérée):', error);
    return NextResponse.json(
      { error: 'Une erreur interne est survenue lors de l\'inscription.' },
      { status: 500 }
    );
  }
}