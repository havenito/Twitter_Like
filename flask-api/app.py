from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt

from config import Config
from models import db
from routes.auth import auth_bp, bcrypt
from routes.posts import posts_bp
from routes.replies import replies_api
from routes.comments import comments_api
from services.file_upload import init_cloudinary
from routes.categories import categories_bp
from routes.follows import follows_api
from routes.chat import chats_bp

# Importer la fonction d'initialisation WebSocket
from routes.websocket_chat import init_socketio

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    jwt = JWTManager(app)
    
    # CORS configuré correctement pour WebSocket et préflight requests
    CORS(app, 
         origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080", "null"],
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         supports_credentials=True)
    
    init_cloudinary(app)
    
    # Enregistrer les blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(posts_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(replies_api)
    app.register_blueprint(comments_api)
    app.register_blueprint(follows_api)
    app.register_blueprint(chats_bp)

    # Initialiser SocketIO avec CORS
    socketio = init_socketio(app)
    
    with app.app_context():
        from models.post_media import PostMedia
        db.create_all()
    
    return app, socketio

if __name__ == '__main__':
    app, socketio = create_app()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)