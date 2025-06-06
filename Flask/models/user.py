from models import db
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy import Column, DateTime

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False) 
    roles = db.Column(db.String(50), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    private = db.Column(db.Boolean, default=False)
    pseudo = db.Column(db.String(50), nullable=True)
    biography = db.Column(db.String(255), nullable=True)
    banner = db.Column(db.String(255), nullable=True)
    subscription = db.Column(ENUM('free', 'plus', 'premium', name='subscription-type'), nullable=False, default='free')
    warn_count = db.Column(db.Integer, default=0)  
    is_banned = db.Column(db.Boolean, default=False)  
    ban_until = Column(DateTime, nullable=True)

    def __repr__(self):
        return f'<User {self.first_name} {self.last_name}>'
    
    def update_subscription(self, new_subscription, commit=True):
        """
        Méthode pour mettre à jour l'abonnement de l'utilisateur.
        Cette méthode doit être utilisée uniquement par le système d'abonnement.
        """
        valid_subscriptions = ['free', 'plus', 'premium']
        if new_subscription in valid_subscriptions:
            self.subscription = new_subscription
            if commit:
                try:
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    raise ValueError(f"Erreur lors de la mise à jour de l'abonnement: {str(e)}")
        else:
            raise ValueError(f"Type d'abonnement invalide: {new_subscription}. Valeurs autorisées: {valid_subscriptions}")
    
    @property
    def subscription_level(self):
        """Retourne le niveau d'abonnement de l'utilisateur"""
        return self.subscription or 'free'
    
    @property
    def is_premium(self):
        """Vérifie si l'utilisateur a un abonnement premium"""
        return self.subscription == 'premium'
    
    @property
    def is_plus_or_premium(self):
        """Vérifie si l'utilisateur a un abonnement plus ou premium"""
        return self.subscription in ['plus', 'premium']
    
    @property
    def is_free(self):
        """Vérifie si l'utilisateur a un abonnement gratuit"""
        return self.subscription == 'free'