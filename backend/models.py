from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Artist(db.Model):
    __tablename__ = 'artists'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)

    # Relationships
    tracks = db.relationship("Track", back_populates="artist")
    albums = db.relationship("Album", back_populates="artist")
    aliases = db.relationship("ArtistAlias", back_populates="artist")


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


class Genre(db.Model):
    __tablename__ = 'genres'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    # Relationships
    tracks = db.relationship("Track", back_populates="genre")
    aliases = db.relationship("GenreAlias", back_populates="genre")


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
