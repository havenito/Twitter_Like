from models import db

class Signalement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)  
    content = db.Column(db.String(255), nullable=False)
    date_signalement = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    statut = db.Column(db.Boolean, default=False)
    report_type = db.Column(db.String(50), nullable=False)