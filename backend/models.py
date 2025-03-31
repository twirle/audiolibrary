from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func

db = SQLAlchemy()


def init_db(app: Flask):
    db.init_app(app)
    with app.app_context():
        db.create_all()


class Artist(db.Model):
    __tablename__ = 'artists'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)

    # Relationships
    tracks = db.relationship("Track", back_populates="artist")
    albums = db.relationship("Album", back_populates="artist")
    aliases = db.relationship("ArtistAlias", back_populates="artist")

    def serialize(self, include_albums=False, include_genres=False):
        result = {
            'id': self.id,
            'name': self.name
        }

        if include_albums:
            # Get track counts efficiently
            album_ids = [album.id for album in self.albums]
            track_counts = {}

            if album_ids:
                counts = db.session.query(
                    Track.albumId, func.count(Track.id)
                ).filter(
                    Track.albumId.in_(album_ids)
                ).group_by(Track.albumId).all()

                track_counts = {album_id: count for album_id, count in counts}

            result['albums'] = [{
                **album.serialize(),
                'trackCount': track_counts.get(album.id, 0)
            } for album in self.albums]

        if include_genres:
            # get genres in one query
            genres = db.session.query(
                Genre.name
            ).join(
                Track, Track.genreId == Genre.id
            ).filter(
                Track.artistId == self.id
            ).distinct().all()

            result['genres'] = [g[0] for g in genres]

        return result


class ArtistAlias(db.Model):
    __tablename__ = 'artist_aliases'
    alias = db.Column(db.String(255), primary_key=True)
    artistId = db.Column('artist_id', db.Integer, db.ForeignKey(
        'artists.id', ondelete='CASCADE'))

    # Relationships
    artist = db.relationship("Artist", back_populates="aliases")


class Album(db.Model):
    __tablename__ = 'albums'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    artistId = db.Column('artist_id', db.Integer, db.ForeignKey('artists.id'))
    year = db.Column(db.Integer)
    albumArtId = db.Column('album_art_id', db.Integer,
                           db.ForeignKey('album_arts.id'))

    # Relationships
    artist = db.relationship("Artist", back_populates="albums")
    tracks = db.relationship("Track", back_populates="album")
    albumArt = db.relationship("AlbumArt")

    def serialize(self, include_tracks=False, include_artist=False):
        """Return serialized representation of Album."""
        # Base album data
        result = {
            'id': self.id,
            'name': self.name,
            'year': self.year,
            'albumArt': self.albumArt.serialize() if self.albumArt else None
        }

        # add artist info
        if include_artist and self.artist:
            result['artist'] = self.artist.name

        # genre for album
        genres = db.session.query(
            Genre.name, func.count(Track.id).label('count')
        ).join(
            Track, Track.genreId == Genre.id
        ).filter(
            Track.albumId == self.id
        ).group_by(Genre.name).order_by(
            db.desc('count')
        ).all()

        if genres:
            # first genre
            result['genre'] = genres[0][0]
            # rest of the genres as array
            result['genres'] = [g[0] for g in genres]
        else:
            result['genre'] = None
            result['genres'] = []

        # tracks if requested
        if include_tracks:
            tracks = Track.query.filter_by(albumId=self.id)\
                .order_by(Track.trackNumber)\
                .all()

            result['tracks'] = [track.serialize() for track in tracks]

        return result


class Genre(db.Model):
    __tablename__ = 'genres'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    # Relationships
    tracks = db.relationship("Track", back_populates="genre")
    aliases = db.relationship("GenreAlias", back_populates="genre")

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'aliases': [alias.alias for alias in self.aliases]
        }


class GenreAlias(db.Model):
    __tablename__ = 'genre_aliases'
    alias = db.Column(db.String(100), primary_key=True)
    genreId = db.Column('genre_id', db.Integer, db.ForeignKey(
        'genres.id', ondelete='CASCADE'))

    # Relationships
    genre = db.relationship("Genre", back_populates="aliases")


class AlbumArt(db.Model):
    __tablename__ = 'album_arts'
    id = db.Column(db.Integer, primary_key=True)
    hash = db.Column(db.String(64), unique=True, nullable=False)
    mimeType = db.Column('mime_type', db.String(50), nullable=False)
    data = db.Column(db.Text)  # Base64 encoded

    # Relationships
    albums = db.relationship("Album", back_populates="albumArt")

    def serialize(self):
        return {
            'data': self.data,
            'mimeType': self.mimeType
        }


class Track(db.Model):
    __tablename__ = 'tracks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    artistId = db.Column('artist_id', db.Integer, db.ForeignKey('artists.id'))
    albumId = db.Column('album_id', db.Integer, db.ForeignKey('albums.id'))
    genreId = db.Column('genre_id', db.Integer, db.ForeignKey('genres.id'))
    duration = db.Column(db.Float)  # in seconds
    bitrate = db.Column(db.Integer)
    trackNumber = db.Column('track_number', db.Integer)
    year = db.Column(db.Integer)
    filepath = db.Column(db.String(512), unique=True, nullable=False)

    # Relationships
    artist = db.relationship("Artist", back_populates="tracks")
    album = db.relationship("Album", back_populates="tracks")
    genre = db.relationship("Genre", back_populates="tracks")

    def serialize(self, include_relations=False):
        """Return serialized representation of Track."""
        result = {
            'id': self.id,
            'title': self.title,
            'duration': self.duration,
            'trackNumber': self.trackNumber,
            'year': self.year,
            'filepath': self.filepath,
            'albumId': self.albumId
        }

        if include_relations:
            result.update({
                'artist': self.artist.name if self.artist else 'Unknown',
                'album': self.album.name if self.album else 'Unknown',
                'genre': self.genre.name if self.genre else None,
                'albumArt': self.album.albumArt.serialize() if self.album and self.album.albumArt else None
            })

        return result


class Setting(db.Model):
    __tablename__ = 'settings'
    key = db.Column(db.String(50), primary_key=True)
    value = db.Column(db.String(255), nullable=False)

    @classmethod
    def get(cls, key, default=None):
        setting = cls.query.get(key)
        return setting.value if setting else default

    @classmethod
    def set(cls, key, value):
        setting = cls.query.get(key)
        if setting:
            setting.value = value
        else:
            setting = cls(key=key, value=value)
        db.session.add(setting)
        db.session.commit()
