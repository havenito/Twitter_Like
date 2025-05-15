from models import db
from datetime import datetime

class Signalement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.String(255), nullable=False)
    date_signalement = db.Column(db.DateTime, default=datetime.utcnow)
    statut = db.Column(db.Boolean, nullable=False)
