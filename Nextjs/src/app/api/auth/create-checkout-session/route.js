import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { planId } = await request.json();

    const priceMap = {
      plus: 'price_1ROyhCQ4HFaTDsy2ltML3IKu',
      premium: 'price_1ROyhzQ4HFaTDsy2roH3gom5'
    };

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceMap[planId],
          quantity: 1,
        },
      ],
      success_url: `${origin}/premium?success=1`,
      cancel_url: `${origin}/premium?canceled=1`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}