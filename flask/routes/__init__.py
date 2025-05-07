from flask import Blueprint
from .user_routes import user_api
from .category_routes import category_api
from .post_routes import post_api

api = Blueprint('api', __name__)

api.register_blueprint(user_api, url_prefix='/api')
api.register_blueprint(category_api, url_prefix='/api')
api.register_blueprint(post_api, url_prefix='/api')
