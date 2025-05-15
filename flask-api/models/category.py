from models import db

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    post_id = db.Column(db.Integer, nullable=True)  # Pour stocker l'ID du dernier post
    
    # Pour accéder à tous les posts de cette catégorie
    posts = db.relationship('Post', backref='category', lazy='dynamic', foreign_keys='Post.category_id')