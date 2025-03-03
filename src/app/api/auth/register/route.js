import { NextResponse } from 'next/server';

// J'ai mis ici un nouvel utilisateur pour pouvoir tester la fonction de register 
const expectedUser = {
  firstName: 'Alexandre',
  lastName: 'Drain',
  email: 'alex.drain0908@gmail.com',
  username: 'Drac0niX',
  password: 'zizilong',
  isPublic: true
};

export async function POST(req) {
  try {
    const formData = await req.formData();
    
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const username = formData.get('username');
    const password = formData.get('password');
    const isPublic = formData.get('isPublic') === 'true';
    
    if (!firstName || !lastName || !email || !username || !password) {
      return NextResponse.json({ 
        error: 'Tous les champs sont obligatoires' 
      }, { status: 400 });
    }
    
    if (
      firstName === expectedUser.firstName &&
      lastName === expectedUser.lastName &&
      email === expectedUser.email &&
      username === expectedUser.username &&
      password === expectedUser.password &&
      isPublic === expectedUser.isPublic
    ) {
      return NextResponse.json({
        success: true,
        message: 'Inscription réussie. Vueillez vous connecter.',
        userId: 1, 
        token: 'simulated-registration-token-' + Date.now()
      }, { status: 201 });
    } else {
      let errorMsg = 'Les informations fournies ne correspondent pas à celles attendues.';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return NextResponse.json({ 
      error: 'Une erreur est survenue lors de l\'inscription' 
    }, { status: 500 });
  }
}