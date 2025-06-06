from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .category import Category
from .post import Post
from .user import User
from .comment import Comment 
from .signalement import Signalement
from .abonnement import Abonnement
from .replie import Replie
from .notification import Notification


