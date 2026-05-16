from flask import Blueprint, request, jsonify, abort
from firebase_config import db
from utils.helpers import verify_token

match_bp = Blueprint('match', __name__)


def score_registration(reg, keywords):
    hay = ' '.join([str(reg.get(k, '')).lower() for k in ('name', 'description', 'gender', 'age')])
    score = 0
    for w in keywords:
        if w in hay:
            score += 1
    return score


@match_bp.route('/search', methods=['POST'])
def search():
    _ = verify_token(request)
    body = request.get_json() or {}
    q = (body.get('query') or '').strip().lower()
    if not q:
        abort(400, description='Query required')
    words = [w for w in q.split() if len(w) > 1]
    try:
        regs = db.collection('registrations').stream()
        scored = []
        for d in regs:
            r = d.to_dict()
            s = score_registration(r, words)
            if s > 0:
                scored.append({'registration': {**r, 'id': d.id}, 'score': s})
        scored.sort(key=lambda x: x['score'], reverse=True)
        return jsonify({'success': True, 'data': scored[:5]})
    except Exception as e:
        abort(500, description=str(e))
