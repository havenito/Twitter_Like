# from flask import Flask
# from config import Config
# from models import db
# from routes import api



# app = Flask(__name__)
# app.config.from_object(Config)

# db.init_app(app)

# app.register_blueprint(api)

# if __name__ == '__main__':
#     with app.app_context():
#         db.create_all()
#     app.run(debug=True)
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt

from config import Config
from models import db

from routes.auth import auth_bp, bcrypt
from routes.posts import posts_bp
from services.file_upload import init_cloudinary

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app)
    
    init_cloudinary(app)
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(posts_bp)
    
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)