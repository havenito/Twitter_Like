from models import db
from datetime import datetime

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    stripe_customer_id = db.Column(db.String(255), nullable=False)
    stripe_subscription_id = db.Column(db.String(255), unique=True, nullable=False)
    stripe_price_id = db.Column(db.String(255), nullable=False)
    plan = db.Column(db.String(20), nullable=True)  # CHANGÉ : nullable=True au cas où
    status = db.Column(db.String(50), nullable=True)
    current_period_start = db.Column(db.DateTime, nullable=True)
    current_period_end = db.Column(db.DateTime, nullable=True)
    cancel_at_period_end = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relation avec User
    user = db.relationship('User', backref='subscriptions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'stripe_customer_id': self.stripe_customer_id,
            'stripe_subscription_id': self.stripe_subscription_id,
            'stripe_price_id': self.stripe_price_id,
            'plan': self.plan,
            'status': self.status,
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'cancel_at_period_end': self.cancel_at_period_end,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @property
    def is_active(self):
        """Vérifie si l'abonnement est actif"""
        return self.status in ['active', 'trialing']
    
    @property
    def is_expired(self):
        """Vérifie si l'abonnement a expiré"""
        if not self.current_period_end:
            return False
        return datetime.utcnow() > self.current_period_end