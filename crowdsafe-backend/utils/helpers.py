from flask import request, abort
from firebase_admin import auth as firebase_auth


def get_bearer_token(req: request):
    auth = req.headers.get('Authorization') or req.headers.get('authorization')
    if not auth:
        return None
    parts = auth.split()
    if len(parts) == 2 and parts[0].lower() == 'bearer':
        return parts[1]
    return None


def verify_token(req: request):
    token = get_bearer_token(req)
    if not token:
        abort(401, description='Authorization token required')
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except Exception:
        abort(401, description='Invalid or expired token')
