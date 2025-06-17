import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // Transférer le webhook vers Flask
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    console.log('Webhook NextJS - Transfert vers Flask...');

    const response = await fetch(`${process.env.FLASK_API_URL || 'http://localhost:5000'}/api/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: body,
    });

    console.log('Webhook NextJS - Réponse Flask:', response.status);

    if (response.ok) {
      return NextResponse.json({ received: true });
    } else {
      const errorText = await response.text();
      console.error('Webhook NextJS - Erreur Flask:', errorText);
      return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook NextJS - Erreur:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}