from flask import Blueprint, request, jsonify, abort
from firebase_config import db
from firebase_admin import firestore
from utils.helpers import verify_token

alerts_bp = Blueprint('alerts', __name__)


@alerts_bp.route('/report', methods=['POST'])
def report_alert():
    decoded = verify_token(request)
    body = request.get_json() or {}
    try:
        data = {
            'registrationId': body.get('registrationId'),
            'description': body.get('description') or '',
            'eventName': body.get('eventName') or '',
            'reportedBy': body.get('reportedBy') or decoded.get('uid'),
            'photoURL': body.get('photoURL') or '',
            'status': 'missing',
            'timestamp': firestore.SERVER_TIMESTAMP,
        }
        doc_ref = db.collection('alerts').add(data)
        return jsonify({'success': True, 'data': {'alertId': doc_ref[1].id}})
    except Exception as e:
        abort(500, description=str(e))


@alerts_bp.route('/active', methods=['GET'])
def active_alerts():
    try:
        q = db.collection('alerts').where('status', '==', 'missing').order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
        items = []
        for d in q:
            obj = d.to_dict()
            obj['id'] = d.id
            items.append(obj)
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        abort(500, description=str(e))


@alerts_bp.route('/all', methods=['GET'])
def all_alerts():
    decoded = verify_token(request)
    caller_uid = decoded.get('uid')
    caller_doc = db.collection('users').document(caller_uid).get()
    caller_role = (caller_doc.to_dict() or {}).get('role') if caller_doc.exists else None
    if caller_role != 'authority':
        abort(403, description='Only authority can access all alerts')
    try:
        q = db.collection('alerts').order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
        items = []
        for d in q:
            obj = d.to_dict()
            obj['id'] = d.id
            items.append(obj)
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        abort(500, description=str(e))


@alerts_bp.route('/update-status/<alert_id>', methods=['PATCH'])
def update_status(alert_id):
    decoded = verify_token(request)
    body = request.get_json() or {}
    status = (body.get('status') or '').lower()
    if status not in ('missing', 'assisted', 'found'):
        abort(400, description='Invalid status')
    try:
        db.collection('alerts').document(alert_id).update({'status': status})
        return jsonify({'success': True, 'data': None})
    except Exception as e:
        abort(500, description=str(e))


@alerts_bp.route('/event/<event_name>', methods=['GET'])
def by_event(event_name):
    try:
        q = db.collection('alerts').where('eventName', '==', event_name).order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
        items = []
        for d in q:
            obj = d.to_dict()
            obj['id'] = d.id
            items.append(obj)
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        abort(500, description=str(e))
