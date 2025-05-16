from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_mail import Mail # Add this import

from config import Config
from models import db
# Removed bcrypt from here as it's initialized in auth_bp
from routes.auth import auth_bp # bcrypt is initialized within auth_bp
from routes.posts import posts_bp
from services.file_upload import init_cloudinary

mail = Mail() # Initialize Mail instance

def create_app(config_class=Config):
    # Initialize Flask app
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app)
    mail.init_app(app) # Initialize Mail with app context
    
    # Initialize Cloudinary
    init_cloudinary(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(posts_bp)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)