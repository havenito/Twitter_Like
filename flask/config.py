import os
from dotenv import load_dotenv


load_dotenv('../.flaskenv')

class Config:
    SECRET_KEY = 'votre-cle-secrete-a-changer'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://postgres.wubjzcnmqyvehftmoieo:Enzolise1976...@aws-0-eu-west-3.pooler.supabase.com:6543/postgres'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'votre-cle-secrete-a-changer'
    JWT_ACCESS_TOKEN_EXPIRES = 3600
    
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
