from flask import Blueprint, request, jsonify, abort
from firebase_config import db
from firebase_admin import firestore
from utils.helpers import verify_token

volunteers_bp = Blueprint('volunteers', __name__)


@volunteers_bp.route('/cases', methods=['GET'])
def cases():
    _ = verify_token(request)
    try:
        q = db.collection('alerts').where('status', '==', 'missing').stream()
        items = []
        for d in q:
            alert = d.to_dict()
            alert['id'] = d.id
            reg = None
            if alert.get('registrationId'):
                r = db.collection('registrations').document(alert.get('registrationId')).get()
                if r.exists:
                    reg = r.to_dict()
                    reg['id'] = r.id
            items.append({'alert': alert, 'registration': reg})
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        abort(500, description=str(e))


@volunteers_bp.route('/assist/<alert_id>', methods=['PATCH'])
def assist(alert_id):
    decoded = verify_token(request)
    volunteer_id = decoded.get('uid')
    try:
        db.collection('alerts').document(alert_id).update({'status': 'assisted', 'volunteerId': volunteer_id})
        return jsonify({'success': True, 'data': None})
    except Exception as e:
        abort(500, description=str(e))
