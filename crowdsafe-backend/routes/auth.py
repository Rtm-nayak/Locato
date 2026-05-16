from flask import Blueprint, request, jsonify, abort
from firebase_config import db, auth as firebase_auth
from utils.helpers import verify_token

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/verify-token', methods=['POST'])
def verify_token_route():
    decoded = verify_token(request)
    uid = decoded.get('uid')
    try:
        doc = db.collection('users').document(uid).get()
        data = doc.to_dict() if doc.exists else {}
    except Exception:
        data = {}
    return jsonify({'success': True, 'data': {'uid': uid, 'email': decoded.get('email'), 'role': data.get('role')}})


@auth_bp.route('/set-role', methods=['POST'])
def set_role():
    caller = verify_token(request)
    body = request.get_json() or {}
    uid = body.get('uid')
    role = (body.get('role') or '').lower()
    if role not in ('family', 'volunteer', 'authority'):
        abort(400, description='Invalid role')

    # only authority may set roles
    caller_uid = caller.get('uid')
    caller_doc = db.collection('users').document(caller_uid).get()
    caller_role = (caller_doc.to_dict() or {}).get('role') if caller_doc.exists else None
    if caller_role != 'authority':
        abort(403, description='Only authority users can set roles')

    try:
        db.collection('users').document(uid).set({'role': role}, merge=True)
        return jsonify({'success': True, 'data': None})
    except Exception as e:
        abort(500, description=str(e))
