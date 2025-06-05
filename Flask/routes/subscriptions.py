from flask import Blueprint, request, jsonify, current_app
import stripe
import os
from models import db
from models.subscription import Subscription
from models.user import User
from datetime import datetime

subscriptions_bp = Blueprint('subscriptions', __name__)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

PRICE_MAP = {
    "plus": "price_1ROyhCQ4HFaTDsy2ltML3IKu",
    "premium": "price_1ROyhzQ4HFaTDsy2roH3gom5"
}

SUBSCRIPTION_TYPES = ['free', 'plus', 'premium']
SUBSCRIPTION_STATUS_TYPES = ['active', 'canceled']

def validate_subscription_type(subscription_type):
    """Valide que le type d'abonnement est autorisé par l'ENUM"""
    if subscription_type not in SUBSCRIPTION_TYPES:
        raise ValueError(f"Type d'abonnement invalide: {subscription_type}. Valeurs autorisées: {SUBSCRIPTION_TYPES}")
    return subscription_type

def validate_subscription_status(status):
    """Valide que le statut d'abonnement est autorisé par l'ENUM"""
    if status not in SUBSCRIPTION_STATUS_TYPES:
        raise ValueError(f"Statut d'abonnement invalide: {status}. Valeurs autorisées: {SUBSCRIPTION_STATUS_TYPES}")
    return status

@subscriptions_bp.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.get_json()
        plan_id = data.get("planId")
        user_id = data.get("userId")
        origin = request.headers.get("Origin", "http://localhost:3000")

        if plan_id not in PRICE_MAP:
            return jsonify({'error': f'Plan inconnu: {plan_id}. Plans disponibles: {list(PRICE_MAP.keys())}'}), 400
        
        try:
            validate_subscription_type(plan_id)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        existing_subscription = Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()

        if existing_subscription:
            return jsonify({'error': 'Vous avez déjà un abonnement actif. Veuillez d\'abord le résilier avant de souscrire à un nouveau plan.'}), 400

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{
                "price": PRICE_MAP[plan_id],
                "quantity": 1
            }],
            metadata={
                "user_id": str(user_id),
                "plan": plan_id
            },
            customer_email=user.email,
            success_url=f"{origin}/premium?success=1&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin}/premium?canceled=1"
        )

        return jsonify({"url": session.url})

    except Exception as e:
        current_app.logger.error(f"Erreur création session Stripe: {e}")
        return jsonify({'error': 'Erreur lors de la création de la session'}), 500

@subscriptions_bp.route('/api/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get("stripe-signature")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        current_app.logger.error("Payload invalide reçu du webhook Stripe")
        return "Invalid payload", 400
    except stripe.error.SignatureVerificationError:
        current_app.logger.error("Signature invalide du webhook Stripe")
        return "Invalid signature", 400

    try:
        if event["type"] == "checkout.session.completed":
            handle_checkout_completed(event["data"]["object"])
        
        elif event["type"] == "invoice.payment_succeeded":
            handle_payment_succeeded(event["data"]["object"])
        
        elif event["type"] == "customer.subscription.updated":
            handle_subscription_updated(event["data"]["object"])
        
        elif event["type"] == "customer.subscription.deleted":
            handle_subscription_deleted(event["data"]["object"])

        return "Success", 200

    except Exception as e:
        current_app.logger.error(f"Erreur webhook Stripe: {e}")
        return "Error", 500

def handle_checkout_completed(session):
    """Gérer la complétion d'une session de checkout"""
    try:
        session_complete = stripe.checkout.Session.retrieve(session["id"])
        
        user_id = int(session_complete["metadata"].get("user_id"))
        plan_key = session_complete["metadata"].get("plan")
        customer_id = session_complete["customer"]
        subscription_id = session_complete["subscription"]

        current_app.logger.info(f"DEBUG - Traitement checkout pour user_id={user_id}, plan='{plan_key}'")

        try:
            validate_subscription_type(plan_key)
        except ValueError as e:
            current_app.logger.error(f"ERREUR - Plan invalide: {e}")
            return

        user = User.query.get(user_id)
        if not user:
            current_app.logger.error(f"Utilisateur {user_id} non trouvé")
            return
        
        current_app.logger.info(f"DEBUG - Utilisateur trouvé: {user.email}, subscription actuelle: '{user.subscription}'")

        try:
            price_id = PRICE_MAP.get(plan_key, "unknown")
            current_app.logger.info(f"DEBUG - Price ID: {price_id}")

            new_subscription = Subscription(
                user_id=user_id,
                stripe_customer_id=customer_id,
                stripe_subscription_id=subscription_id,
                stripe_price_id=price_id,
                plan=plan_key, 
                status='active',
                current_period_start=datetime.utcnow(),
                current_period_end=None,
            )

            current_app.logger.info(f"DEBUG - Subscription créée avec plan='{new_subscription.plan}', status='{new_subscription.status}'")

            old_subscription = user.subscription
            
            if plan_key in SUBSCRIPTION_TYPES:
                user.subscription = plan_key 
                current_app.logger.info(f"DEBUG - User.subscription changé de '{old_subscription}' à '{user.subscription}'")
            else:
                raise ValueError(f"Type d'abonnement invalide pour ENUM: {plan_key}")

            db.session.add(new_subscription)
            
            db.session.flush()
            
            db.session.commit()

            current_app.logger.info(f"DEBUG - Transaction commitée avec succès")

            user_final = User.query.get(user_id)
            subscription_final = Subscription.query.filter_by(stripe_subscription_id=subscription_id).first()
            
            current_app.logger.info(f"SUCCESS - Abonnement créé pour utilisateur {user_id}")
            current_app.logger.info(f"SUCCESS - User.subscription final: '{user_final.subscription}'")
            current_app.logger.info(f"SUCCESS - Subscription.plan final: '{subscription_final.plan if subscription_final else 'None'}'")
            current_app.logger.info(f"SUCCESS - Subscription.status final: '{subscription_final.status if subscription_final else 'None'}'")

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"ERREUR transaction - Rollback effectué: {e}")
            raise

    except Exception as e:
        current_app.logger.error(f"ERREUR lors de la création de l'abonnement: {e}")
        current_app.logger.error(f"ERREUR - Type: {type(e)}")
        import traceback
        current_app.logger.error(f"ERREUR - Traceback: {traceback.format_exc()}")
        raise

def handle_payment_succeeded(invoice):
    """Gérer le succès d'un paiement"""
    try:
        subscription_id = invoice["subscription"]
        if subscription_id:
            subscription_db = Subscription.query.filter_by(
                stripe_subscription_id=subscription_id
            ).first()
            
            if subscription_db:
                subscription_db.status = 'active'
                
                user = User.query.get(subscription_db.user_id)
                if user and subscription_db.plan:
                    validate_subscription_type(subscription_db.plan)
                    user.update_subscription(subscription_db.plan, commit=False)
                
                db.session.commit()
                current_app.logger.info(f"Abonnement mis à jour: {subscription_id}")

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur lors de la mise à jour du paiement: {e}")
        raise

@subscriptions_bp.route('/api/user/<int:user_id>/subscription', methods=['GET'])
def get_user_subscription(user_id):
    """Récupérer l'abonnement actuel d'un utilisateur"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
        subscription = Subscription.query.filter_by(
            user_id=user_id, 
            status='active'
        ).first()
        
        return jsonify({
            'subscription': subscription.to_dict() if subscription else None,
            'plan': user.subscription_level
        }), 200

    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération de l'abonnement: {e}")
        return jsonify({'error': 'Erreur interne'}), 500

@subscriptions_bp.route('/api/user/<int:user_id>/cancel-subscription', methods=['POST'])
def cancel_subscription(user_id):
    """Annuler l'abonnement d'un utilisateur immédiatement"""
    try:
        subscription = Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()
        
        if not subscription:
            return jsonify({'error': 'Aucun abonnement actif trouvé'}), 404

        current_app.logger.info(f"DEBUG - Annulation de l'abonnement {subscription.stripe_subscription_id} pour l'utilisateur {user_id}")

        try:
            canceled_subscription = stripe.Subscription.cancel(subscription.stripe_subscription_id)
            current_app.logger.info(f"DEBUG - Abonnement Stripe annulé: {canceled_subscription.status}")
        except Exception as stripe_error:
            current_app.logger.error(f"ERREUR Stripe lors de l'annulation: {stripe_error}")
            return jsonify({'error': 'Erreur lors de l\'annulation sur Stripe'}), 500

        current_time = datetime.utcnow()
        subscription.status = 'canceled'
        subscription.current_period_end = current_time
        
        user = User.query.get(user_id)
        if user:
            old_subscription = user.subscription
            validate_subscription_type('free')
            user.subscription = 'free'
            current_app.logger.info(f"DEBUG - Utilisateur {user_id} passé de '{old_subscription}' à 'free'")
        
        db.session.commit()
        
        current_app.logger.info(f"SUCCESS - Abonnement annulé immédiatement pour l'utilisateur {user_id} à {current_time}")
        
        return jsonify({
            'message': 'Abonnement résilié immédiatement avec succès',
            'status': 'canceled',
            'new_plan': 'free',
            'canceled_at': current_time.isoformat()
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur lors de l'annulation: {e}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Erreur lors de l\'annulation'}), 500