# import os


# class Config:
#     SQLALCHEMY_DATABASE_URI = 'sqlite:///' + \
#         os.path.join(os.path.abspath(
#             os.path.dirname(__file__)), 'audiolibrary.db')
#     SQLALCHEMY_TRACK_MODIFICATIONS = False
#     AUDIO_DIRECTORY = "/mnt/h/FLAC Music/Tatsuro Yamashita (山下達郎)"

#     SQLALCHEMY_POOL_RECYCLE = 299
#     SQLALCHEMY_POOL_PRE_PING = True


import os


class Config:
    # Database config
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(
        os.path.abspath(os.path.dirname(__file__)),
        'audiolibrary.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Audio file location
    AUDIO_DIRECTORY = "/mnt/h/FLAC Music/Tatsuro Yamashita (山下達郎)"

    # Performance optimizations
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300
    }
