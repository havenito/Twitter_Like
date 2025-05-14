import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg2://admin:secret@10.1.4.103:5433/twitterlike'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
