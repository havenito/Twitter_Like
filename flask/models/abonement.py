from models import db
from datetime import datetime

class Abonnements(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    abonné_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    abonnement_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_suivi = db.Column(db.DateTime, default=datetime.utcnow)
