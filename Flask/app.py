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
from routes.subscriptions import subscriptions_bp
from routes.likes import likes_bp
from routes.favorites import favorites_bp
from routes.polls import polls_bp
from routes.notifications import notifications_bp
from routes.comment_likes import comment_likes_bp
from routes.reply_likes import reply_likes_bp
from routes.chat import chat_bp

from routes.websocket_chat import init_socketio

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
    app.register_blueprint(likes_bp)
    app.register_blueprint(favorites_bp)
    app.register_blueprint(polls_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(comment_likes_bp)
    app.register_blueprint(reply_likes_bp)
    app.register_blueprint(chat_bp)
    
    socketio = init_socketio(app)

    with app.app_context():
        from models.post_media import PostMedia
        from models.comment_media import CommentMedia
        from models.comment_like import CommentLike
        from models.reply_media import ReplyMedia 
        from models.reply_like import ReplyLike
        from models.subscription import Subscription
        from models.favorite import Favorite
        db.create_all()
    
    return app, socketio

if __name__ == '__main__':
    app, socketio = create_app()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)