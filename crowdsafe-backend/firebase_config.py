from dotenv import load_dotenv
import os
import firebase_admin
from firebase_admin import credentials

load_dotenv()

FIREBASE_CREDENTIALS = os.getenv('FIREBASE_CREDENTIALS')

if not FIREBASE_CREDENTIALS:
    raise RuntimeError('FIREBASE_CREDENTIALS not set in environment')

cred = credentials.Certificate(FIREBASE_CREDENTIALS)
app = firebase_admin.initialize_app(cred)

from firebase_admin import firestore, auth

db = firestore.client()

__all__ = ['app', 'db', 'auth']
