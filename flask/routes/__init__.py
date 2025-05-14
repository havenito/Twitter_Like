from flask import Blueprint
from .user_routes import user_api
from .category_routes import category_api
from .post_routes import post_api
from .payment_routes import payment_api
from .comment_routes import comment_api
from .notification_routes import notification_api
from .replie_routes import replie_api
from .signalement_routes import signalement_api

api = Blueprint('api', __name__)

api.register_blueprint(user_api, url_prefix='/api')
api.register_blueprint(category_api, url_prefix='/api')
api.register_blueprint(post_api, url_prefix='/api')
api.register_blueprint(payment_api, url_prefix='/api')
api.register_blueprint(comment_api, url_prefix='/api')
api.register_blueprint(notification_api, url_prefix='/api')
api.register_blueprint(replie_api, url_prefix='/api')
api.register_blueprint(signalement_api, url_prefix='/api')
