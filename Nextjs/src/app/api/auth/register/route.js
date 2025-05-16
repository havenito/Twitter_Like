import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const clientFormData = await req.formData();

    const flaskFormData = new FormData();

    const firstName = clientFormData.get('firstName');
    const lastName = clientFormData.get('lastName');
    const email = clientFormData.get('email');
    const pseudo = clientFormData.get('pseudo');
    const password = clientFormData.get('password');
    const isPublic = clientFormData.get('isPublic'); 
    const profilePictureFile = clientFormData.get('profile_picture');

    if (!firstName || !email || !pseudo || !password) {
      return NextResponse.json({
        error: 'Les champs prénom, email, pseudo et mot de passe sont obligatoires'
      }, { status: 400 });
    }

    flaskFormData.append('first_name', firstName);
    if (lastName && lastName !== 'null') {
        flaskFormData.append('last_name', lastName);
    } else {
        flaskFormData.append('last_name', ''); 
    }
    flaskFormData.append('email', email);
    flaskFormData.append('pseudo', pseudo);
    flaskFormData.append('password', password);
    flaskFormData.append('isPublic', isPublic); 
    flaskFormData.append('roles', 'user');

    if (profilePictureFile && profilePictureFile.size > 0) {
      flaskFormData.append('profile_picture', profilePictureFile);
    }

    const flaskApiResponse = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      body: flaskFormData,
    });

    let flaskApiData;
    try {
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
        { status: flaskApiResponse.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: flaskApiData.message || 'Inscription réussie. Veuillez vous connecter.',
        profile_picture: flaskApiData.profile_picture 
      },
      { status: flaskApiResponse.status }
    );

  } catch (error) {
    console.error('Erreur interne dans /api/auth/register (Next.js):', error);
    return NextResponse.json(
      { error: 'Une erreur interne est survenue lors de l\'inscription.' },
      { status: 500 }
    );
  }
}