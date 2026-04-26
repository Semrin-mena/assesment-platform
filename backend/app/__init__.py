from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import close_db, init_db


def create_app():
    app = Flask(__name__)
    app.config.from_mapping(
        DATABASE_PATH=Config.DATABASE_PATH,
        OPENAI_API_KEY=Config.OPENAI_API_KEY,
        JWT_SECRET=Config.JWT_SECRET,
    )

    CORS(app, origins=Config.CORS_ORIGINS)

    app.teardown_appcontext(close_db)

    # Initialize the database
    init_db(app)

    # Register blueprints
    from app.blueprints import auth, prompts, assessments, admin, marlin
    app.register_blueprint(auth.bp)
    app.register_blueprint(prompts.bp)
    app.register_blueprint(assessments.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(marlin.bp)

    return app
