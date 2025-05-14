from flask import Blueprint, request, jsonify
import stripe

stripe.api_key = 'k_test_51ROa342ZGPs65kgN9QIVAadOFTsrLJme0SarSvfotkgIVIOW9S3LTM6UIgtjMkVZf3gDnPwT7IADEnMRYYbqqCu300BLXVBYNbte_stripe'

payment_api = Blueprint('payment_api', __name__)

@payment_api.route('/create-payment-intent', methods=['POST'])
def create_payment():
    try:
        data = request.get_json()
        amount = data['amount']
        payment_intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='eur'
        )
        return jsonify({'clientSecret': payment_intent['client_secret']})
    except Exception as e:
        return jsonify(error=str(e)), 403
    
