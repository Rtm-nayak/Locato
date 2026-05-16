from flask import Blueprint

def register_routes(app):
    from .auth import auth_bp
    from .registrations import registrations_bp
    from .alerts import alerts_bp
    from .match import match_bp
    from .volunteers import volunteers_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(registrations_bp, url_prefix='/api/registrations')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(match_bp, url_prefix='/api/match')
    app.register_blueprint(volunteers_bp, url_prefix='/api/volunteers')
