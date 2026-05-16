from flask import Blueprint, request, jsonify, abort
from firebase_config import db
from firebase_admin import firestore
from utils.helpers import verify_token

registrations_bp = Blueprint('registrations', __name__)


@registrations_bp.route('/add', methods=['POST'])
def add_registration():
    decoded = verify_token(request)
    body = request.get_json() or {}
    required = ['uid', 'name', 'description', 'emergencyContact']
    for k in required:
        if not body.get(k):
            abort(400, description=f'Missing field: {k}')

    try:
        data = {
            'uid': body.get('uid'),
            'name': body.get('name'),
            'age': body.get('age'),
            'gender': body.get('gender') or '',
            'description': body.get('description'),
            'photoURL': body.get('photoURL') or '',
            'emergencyContact': body.get('emergencyContact'),
            'eventName': body.get('eventName') or '',
            'createdAt': firestore.SERVER_TIMESTAMP,
        }
        doc_ref = db.collection('registrations').add(data)
        return jsonify({'success': True, 'data': {'id': doc_ref[1].id}})
    except Exception as e:
        abort(500, description=str(e))


@registrations_bp.route('/my/<uid>', methods=['GET'])
def my_registrations(uid):
    decoded = verify_token(request)
    # allow only the owner or authority
    caller_uid = decoded.get('uid')
    caller_doc = db.collection('users').document(caller_uid).get()
    caller_role = (caller_doc.to_dict() or {}).get('role') if caller_doc.exists else None
    if caller_uid != uid and caller_role != 'authority':
        abort(403, description='Forbidden')

    try:
        q = db.collection('registrations').where('uid', '==', uid).stream()
        items = []
        for d in q:
            obj = d.to_dict()
            obj['id'] = d.id
            items.append(obj)
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        abort(500, description=str(e))


@registrations_bp.route('/all', methods=['GET'])
def all_registrations():
    decoded = verify_token(request)
    caller_uid = decoded.get('uid')
    caller_doc = db.collection('users').document(caller_uid).get()
    caller_role = (caller_doc.to_dict() or {}).get('role') if caller_doc.exists else None
    if caller_role != 'authority':
        abort(403, description='Only authority can access all registrations')

    try:
        q = db.collection('registrations').stream()
        items = []
        for d in q:
            obj = d.to_dict()
            obj['id'] = d.id
            items.append(obj)
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        abort(500, description=str(e))


@registrations_bp.route('/<doc_id>', methods=['DELETE'])
def delete_registration(doc_id):
    decoded = verify_token(request)
    caller_uid = decoded.get('uid')
    try:
        doc_ref = db.collection('registrations').document(doc_id)
        snap = doc_ref.get()
        if not snap.exists:
            abort(404, description='Not found')
        data = snap.to_dict()
        owner_uid = data.get('uid')
        caller_doc = db.collection('users').document(caller_uid).get()
        caller_role = (caller_doc.to_dict() or {}).get('role') if caller_doc.exists else None
        if caller_uid != owner_uid and caller_role != 'authority':
            abort(403, description='Forbidden')
        doc_ref.delete()
        return jsonify({'success': True, 'data': None})
    except Exception as e:
        abort(500, description=str(e))
