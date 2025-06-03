from flask import Blueprint, request, jsonify, current_app
import stripe
import os
from models import db
from models.subscription import Subscription
from models.user import User
from datetime import datetime

subscriptions_bp = Blueprint('subscriptions', __name__)

# Configuration Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Mapping des plans vers les prix Stripe
PRICE_MAP = {
    "plus": "price_1ROyhCQ4HFaTDsy2ltML3IKu",
    "premium": "price_1ROyhzQ4HFaTDsy2roH3gom5"
}

# CORRECTION : Constantes pour les valeurs ENUM
SUBSCRIPTION_TYPES = ['free', 'plus', 'premium']

def validate_subscription_type(subscription_type):
    """Valide que le type d'abonnement est autorisé par l'ENUM"""
    if subscription_type not in SUBSCRIPTION_TYPES:
        raise ValueError(f"Type d'abonnement invalide: {subscription_type}. Valeurs autorisées: {SUBSCRIPTION_TYPES}")
    return subscription_type

@subscriptions_bp.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.get_json()
        plan_id = data.get("planId")
        user_id = data.get("userId")
        origin = request.headers.get("Origin", "http://localhost:3000")

        # CORRECTION : Validation du plan avec ENUM
        if plan_id not in PRICE_MAP:
            return jsonify({'error': f'Plan inconnu: {plan_id}. Plans disponibles: {list(PRICE_MAP.keys())}'}), 400
        
        # Validation ENUM
        try:
            validate_subscription_type(plan_id)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        # Vérifier que l'utilisateur existe
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        # Vérifier si l'utilisateur a déjà un abonnement actif
        existing_subscription = Subscription.query.filter_by(
            user_id=user_id
        ).filter(Subscription.status.in_(['active', 'trialing'])).first()

        if existing_subscription:
            return jsonify({'error': 'Vous avez déjà un abonnement actif'}), 400

        # Créer la session Stripe
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
        # Récupérer la session complète depuis Stripe
        session_complete = stripe.checkout.Session.retrieve(session["id"])
        
        user_id = int(session_complete["metadata"].get("user_id"))
        plan_key = session_complete["metadata"].get("plan")  # 'plus' ou 'premium'
        customer_id = session_complete["customer"]
        subscription_id = session_complete["subscription"]

        current_app.logger.info(f"DEBUG - Traitement checkout pour user_id={user_id}, plan='{plan_key}'")

        # CORRECTION : Validation du plan avec ENUM
        try:
            validate_subscription_type(plan_key)
        except ValueError as e:
            current_app.logger.error(f"ERREUR - Plan invalide: {e}")
            return

        # Récupérer l'utilisateur
        user = User.query.get(user_id)
        if not user:
            current_app.logger.error(f"Utilisateur {user_id} non trouvé")
            return
        
        current_app.logger.info(f"DEBUG - Utilisateur trouvé: {user.email}, subscription actuelle: '{user.subscription}'")

        # DÉBUT DE TRANSACTION
        try:
            # CORRECTION : Version simple avec gestion d'erreur robuste
            price_id = PRICE_MAP.get(plan_key, "unknown")
            current_app.logger.info(f"DEBUG - Price ID: {price_id}")

            # CORRECTION : Créer l'enregistrement avec des valeurs par défaut sûres
            new_subscription = Subscription(
                user_id=user_id,
                stripe_customer_id=customer_id,
                stripe_subscription_id=subscription_id,
                stripe_price_id=price_id,
                plan=plan_key,  # 'plus' ou 'premium' - validé par ENUM
                plan_name=f"Minouverse {plan_key.capitalize()}",  # 'Minouverse Plus' ou 'Minouverse Premium'
                status='active',  # Valeur par défaut
                current_period_start=datetime.utcnow(),  # Valeur par défaut
                current_period_end=datetime.utcnow(),  # Valeur par défaut (sera mise à jour par les webhooks suivants)
                cancel_at_period_end=False
            )

            current_app.logger.info(f"DEBUG - Subscription créée avec plan='{new_subscription.plan}', plan_name='{new_subscription.plan_name}'")

            # CORRECTION : Mettre à jour directement la colonne subscription de l'utilisateur avec validation ENUM
            old_subscription = user.subscription
            
            # CORRECTION : Validation explicite avant assignation pour l'ENUM
            if plan_key in SUBSCRIPTION_TYPES:
                user.subscription = plan_key  # PostgreSQL va valider l'ENUM automatiquement
                current_app.logger.info(f"DEBUG - User.subscription changé de '{old_subscription}' à '{user.subscription}'")
            else:
                raise ValueError(f"Type d'abonnement invalide pour ENUM: {plan_key}")

            # Ajouter l'abonnement à la session
            db.session.add(new_subscription)
            
            # IMPORTANT : Forcer la synchronisation avant le commit
            db.session.flush()
            
            # Commiter tout ensemble - PostgreSQL validera l'ENUM ici
            db.session.commit()

            current_app.logger.info(f"DEBUG - Transaction commitée avec succès")

            # Vérification finale avec une nouvelle requête
            user_final = User.query.get(user_id)
            subscription_final = Subscription.query.filter_by(stripe_subscription_id=subscription_id).first()
            
            current_app.logger.info(f"SUCCESS - Abonnement créé pour utilisateur {user_id}")
            current_app.logger.info(f"SUCCESS - User.subscription final: '{user_final.subscription}'")
            current_app.logger.info(f"SUCCESS - Subscription.plan final: '{subscription_final.plan if subscription_final else 'None'}'")
            current_app.logger.info(f"SUCCESS - Subscription.plan_name final: '{subscription_final.plan_name if subscription_final else 'None'}'")

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
                # Mettre à jour l'abonnement de l'utilisateur avec validation ENUM
                user = User.query.get(subscription_db.user_id)
                if user and subscription_db.plan:
                    # Valider avant mise à jour
                    validate_subscription_type(subscription_db.plan)
                    user.update_subscription(subscription_db.plan, commit=False)
                
                db.session.commit()
                current_app.logger.info(f"Abonnement mis à jour: {subscription_id}")

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur lors de la mise à jour du paiement: {e}")
        raise

def handle_subscription_updated(subscription):
    """Gérer la mise à jour d'un abonnement"""
    try:
        subscription_db = Subscription.query.filter_by(
            stripe_subscription_id=subscription["id"]
        ).first()
        
        if subscription_db:
            # Mettre à jour l'abonnement de l'utilisateur avec validation ENUM
            user = User.query.get(subscription_db.user_id)
            if user and subscription_db.plan:
                validate_subscription_type(subscription_db.plan)
                user.update_subscription(subscription_db.plan, commit=False)
            
            db.session.commit()
            current_app.logger.info(f"Abonnement mis à jour: {subscription['id']}")

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur lors de la mise à jour de l'abonnement: {e}")
        raise

def handle_subscription_deleted(subscription):
    """Gérer la suppression/annulation d'un abonnement"""
    try:
        subscription_db = Subscription.query.filter_by(
            stripe_subscription_id=subscription["id"]
        ).first()
        
        if subscription_db:
            subscription_db.status = "canceled"
            
            # Remettre l'utilisateur en abonnement free (validé par ENUM)
            user = User.query.get(subscription_db.user_id)
            if user:
                validate_subscription_type('free')  # Validation explicite
                user.update_subscription('free', commit=False)
            
            db.session.commit()
            current_app.logger.info(f"Abonnement annulé: {subscription['id']}")

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur lors de l'annulation de l'abonnement: {e}")
        raise

@subscriptions_bp.route('/api/user/<int:user_id>/subscription', methods=['GET'])
def get_user_subscription(user_id):
    """Récupérer l'abonnement actuel d'un utilisateur"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
        subscription = Subscription.query.filter_by(user_id=user_id).first()
        
        return jsonify({
            'subscription': subscription.to_dict() if subscription else None,
            'plan': user.subscription_level
        }), 200

    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération de l'abonnement: {e}")
        return jsonify({'error': 'Erreur interne'}), 500

@subscriptions_bp.route('/api/user/<int:user_id>/cancel-subscription', methods=['POST'])
def cancel_subscription(user_id):
    """Annuler l'abonnement d'un utilisateur"""
    try:
        subscription = Subscription.query.filter_by(
            user_id=user_id
        ).filter(Subscription.status.in_(['active', 'trialing'])).first()
        
        if not subscription:
            return jsonify({'error': 'Aucun abonnement actif trouvé'}), 404

        # Annuler dans Stripe
        stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            cancel_at_period_end=True
        )

        # Mettre à jour en base
        subscription.cancel_at_period_end = True
        db.session.commit()

        return jsonify({'message': 'Abonnement programmé pour annulation'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur lors de l'annulation: {e}")
        return jsonify({'error': 'Erreur lors de l\'annulation'}), 500

@subscriptions_bp.route('/api/user/<int:user_id>/resume-subscription', methods=['POST'])
def resume_subscription(user_id):
    """Reprendre un abonnement annulé"""
    try:
        subscription = Subscription.query.filter_by(
            user_id=user_id,
            cancel_at_period_end=True
        ).first()
        
        if not subscription:
            return jsonify({'error': 'Aucun abonnement à reprendre'}), 404

        # Reprendre dans Stripe
        stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            cancel_at_period_end=False
        )

        # Mettre à jour en base
        subscription.cancel_at_period_end = False
        db.session.commit()

        return jsonify({'message': 'Abonnement repris avec succès'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur lors de la reprise: {e}")
        return jsonify({'error': 'Erreur lors de la reprise'}), 500