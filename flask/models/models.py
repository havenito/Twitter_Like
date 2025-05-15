from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    roles = db.Column(db.JSON, nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    profile_picture = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_accepted = db.Column(db.Boolean, nullable=False)
    private = db.Column(db.Boolean, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "profile_picture": self.profile_picture,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "is_accepted": self.is_accepted,
            "private": self.private
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    nb_publications = db.Column(db.String(60), nullable=False)
    description = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "nb_publications": self.nb_publications,
            "description": self.description
        }

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    published_at = db.Column(db.DateTime, nullable=False)
    media_url = db.Column(db.String(255), nullable=False)
    media_type = db.Column(db.String)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "published_at": self.published_at,
            "media_url": self.media_url,
            "media_type": self.media_type,
            "user_id": self.user_id,
            "category_id": self.category_id
        }

class Comments(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    comment_id = db.Column(db.Integer, db.ForeignKey('comments.id'))

    def to_dict(self):
        return {
            "id": self.id,
            "content": self.content,
            "created_at": self.created_at,
            "status": self.status,
            "user_id": self.user_id,
            "post_id": self.post_id,
            "comment_id": self.comment_id
        }

class Abonnements(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    abonné_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    abonnement_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_suivi = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "abonné_id": self.abonné_id,
            "abonnement_id": self.abonnement_id,
            "date_suivi": self.date_suivi
        }

class Notifications(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    comments_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "post_id": self.post_id,
            "comments_id": self.comments_id,
            "user_id": self.user_id,
            "date": self.date
        }

class Replies(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    comment_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "comment_id": self.comment_id,
            "user_id": self.user_id,
            "content": self.content,
            "created_at": self.created_at
        }

class Signalement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.String(255), nullable=False)
    date_signalement = db.Column(db.DateTime, default=datetime.utcnow)
    statut = db.Column(db.Boolean, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "content": self.content,
            "date_signalement": self.date_signalement,
            "statut": self.statut
        }
