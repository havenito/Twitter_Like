from models import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import ENUM

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    stripe_customer_id = db.Column(db.String(255), nullable=False)
    stripe_subscription_id = db.Column(db.String(255), unique=True, nullable=False)
    stripe_price_id = db.Column(db.String(255), nullable=False)
    plan = db.Column(ENUM('free', 'plus', 'premium', name='subscription-type'), nullable=False, default='free')
    status = db.Column(ENUM('active', 'canceled', name='subscription-status'), nullable=False, default='active')
    current_period_start = db.Column(db.DateTime, nullable=True)
    current_period_end = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
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
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @property
    def is_active(self):
        """Vérifie si l'abonnement est actif"""
        return self.status == 'active'
    
    @property
    def is_canceled(self):
        """Vérifie si l'abonnement est annulé"""
        return self.status == 'canceled'
    
    @property
    def is_expired(self):
        """Vérifie si l'abonnement a expiré"""
        if not self.current_period_end:
            return False
        return datetime.utcnow() > self.current_period_end
    
    @property
    def is_free(self):
        """Vérifie si l'abonnement est gratuit"""
        return self.plan == 'free'
    
    @property
    def is_plus(self):
        """Vérifie si l'abonnement est Plus"""
        return self.plan == 'plus'
    
    @property
    def is_premium(self):
        """Vérifie si l'abonnement est Premium"""
        return self.plan == 'premium'
    
    def update_plan(self, new_plan, commit=True):
        """
        Méthode pour mettre à jour le plan d'abonnement avec validation ENUM
        """
        valid_plans = ['free', 'plus', 'premium']
        if new_plan in valid_plans:
            self.plan = new_plan
            if commit:
                try:
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    raise ValueError(f"Erreur lors de la mise à jour du plan: {str(e)}")
        else:
            raise ValueError(f"Plan invalide: {new_plan}. Valeurs autorisées: {valid_plans}")

    def activate(self, commit=True):
        """Active l'abonnement"""
        self.status = 'active'
        if commit:
            try:
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                raise ValueError(f"Erreur lors de l'activation: {str(e)}")

    def cancel(self, commit=True):
        """Annule l'abonnement"""
        self.status = 'canceled'
        if commit:
            try:
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                raise ValueError(f"Erreur lors de l'annulation: {str(e)}")