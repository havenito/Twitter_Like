import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const pseudo = formData.get('pseudo');
    const password = formData.get('password');
    const isPublic = formData.get('isPublic') === 'true';
    
    if (!firstName || !lastName || !email || !pseudo || !password) {
      return NextResponse.json({ 
        error: 'Tous les champs sont obligatoires' 
      }, { status: 400 });
    }
    
    // Call Flask API to create the user
    const response = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        roles: 'user', // Adjust based on your role structure
        first_name: firstName,
        last_name: lastName,
        profile_picture: null, // Handle profile picture separately
        private: !isPublic,
        pseudo
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Échec de l\'inscription');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Inscription réussie. Veuillez vous connecter.',
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return NextResponse.json({ 
      error: 'Une erreur est survenue lors de l\'inscription' 
    }, { status: 500 });
  }
}