from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_mail import Mail

from config import Config
from models import db
from routes.auth import auth_bp, bcrypt
from routes.posts import posts_bp
from routes.replies import replies_api
from routes.comments import comments_api
from services.file_upload import init_cloudinary
from routes.categories import categories_bp
from routes.follows import follows_api
from services.file_upload import init_cloudinary
from routes.subscriptions import subscriptions_bp
from routes.signalement import bp_signalement 
from routes.warn import warn_bp

mail = Mail()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app)
    mail.init_app(app)
    
    init_cloudinary(app)
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(posts_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(replies_api)
    app.register_blueprint(comments_api)
    app.register_blueprint(follows_api)
    app.register_blueprint(subscriptions_bp)
    app.register_blueprint(bp_signalement) 
    app.register_blueprint(warn_bp)

    
    with app.app_context():
        from models.post_media import PostMedia
        from models.subscription import Subscription
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)