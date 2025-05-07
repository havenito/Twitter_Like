from flask import Blueprint

api = Blueprint('api', __name__)

from .user_routes import user_api
from .category_routes import category_api
from .post_routes import post_api

api.register_blueprint(user_api, url_prefix='/api')
api.register_blueprint(category_api, url_prefix='/api')
api.register_blueprint(post_api, url_prefix='/api')
