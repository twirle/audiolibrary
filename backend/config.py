import os
from pathlib import Path


class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(
        os.path.abspath(os.path.dirname(__file__)),
        'audiolibrary.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # audio file source
    DEFAULT_MUSIC_FOLDER = [
        str(Path.home()),
        "/Volumes",
    ]

    # current hardcoded source
    AUDIO_DIRECTORY = "/mnt/h/FLAC Music/Tatsuro Yamashita (山下達郎)"

    ALLOWED_PATHS = []

    ALLOWED_PATHS.extend(DEFAULT_MUSIC_FOLDER)
    ALLOWED_PATHS.extend(AUDIO_DIRECTORY)
    ALLOWED_PATHS.extend('/mnt/h/FLAC Music')

    # Engine options remain the same
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300
    }
