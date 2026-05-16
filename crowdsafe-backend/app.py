from flask import Flask, jsonify
from flask_cors import CORS
import os

from routes import register_routes

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    register_routes(app)

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'error': 'Not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

    return app


app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
