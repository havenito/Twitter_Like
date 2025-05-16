import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables
load_dotenv('../.flaskenv')

class Config:
    SECRET_KEY = 'votre-cle-secrete-a-changer'  # Change in production
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://postgres.wubjzcnmqyvehftmoieo:Enzolise1976...@aws-0-eu-west-3.pooler.supabase.com:6543/postgres'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'votre-cle-secrete-jwt-a-changer'  # Change in production
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)  # Use timedelta here
    
    # Cloudinary configuration
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')

    # Mail configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')

    # Frontend URL
    FRONTEND_URL = os.environ.get('FRONTEND_URL') or 'http://localhost:3000'