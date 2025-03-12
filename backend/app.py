from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate
from models import db, Artist, Album, Genre, AlbumArt, Track
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
db.init_app(app)
migrate = Migrate(app, db)


@app.route('/api/tracks')
def getTracks():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 100, type=int)

    # get paginated tracks with relationships
    tracks = (
        Track.query
        .options(
            db.joinedload(Track.artist),
            db.joinedload(Track.album).joinedload(Album.albumArt),
            db.joinedload(Track.genre)
        )
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return jsonify({
        'tracks': [{
            'id': t.id,
            'title': t.title,
            'artist': t.artist.name if t.artist else 'Unknown',
            'album': t.album.name if t.album else 'Unknown',
            'genre': t.genre.name if t.genre else None,
            'duration': t.duration,
            'trackNumber': t.trackNumber,
            'year': t.year,
            'albumArt': {
                'data': t.album.albumArt.data,
                'mimeType': t.album.albumArt.mimeType
            } if t.album and t.album.albumArt else None
        } for t in tracks.items],
        'pagination': {
            'page': tracks.page,
            'pages': tracks.pages,
            'total': tracks.total
        }
    })


@app.route('/api/artists')
def getArtists():
    artists = Artist.query.all()
    return jsonify([{
        'id': a.id,
        'name': a.name,
        'albumCount': Album.query.filter_by(artistId=a.id).count(),
        'trackCount': Track.query.filter_by(artistId=a.id).count()
    } for a in artists])


@app.route('/api/artists/<int:artist_id>')
def getArtist(artist_id):
    artist = Artist.query.get_or_404(artist_id)
    albums = Album.query.filter_by(artistId=artist.id).all()

    return jsonify({
        'id': artist.id,
        'name': artist.name,
        'albums': [{
            'id': album.id,
            'name': album.name,
            'year': album.year,
            'trackCount': Track.query.filter_by(albumId=album.id).count(),
            'albumArt': {
                'data': album.albumArt.data,
                'mimeType': album.albumArt.mimeType
            } if album.albumArt else None
        } for album in albums]
    })


@app.route('/api/albums/<int:album_id>')
def getAlbum(album_id):
    album = Album.query.options(
        db.joinedload(Album.artist),
        db.joinedload(Album.albumArt)
    ).get_or_404(album_id)

    tracks = Track.query.filter_by(
        albumId=album.id).order_by(Track.trackNumber).all()

    return jsonify({
        'id': album.id,
        'name': album.name,
        'artist': album.artist.name if album.artist else 'Unknown',
        'year': album.year,
        'albumArt': {
            'data': album.albumArt.data,
            'mimeType': album.albumArt.mimeType
        } if album.albumArt else None,
        'tracks': [{
            'id': track.id,
            'title': track.title,
            'trackNumber': track.trackNumber,
            'duration': track.duration
        } for track in tracks]
    })


@app.route('/api/debug/album-art')
def debugAlbumArt():
    art_count = AlbumArt.query.count()
    albums_with_art = Album.query.filter(Album.albumArtId != None).count()
    albums_without_art = Album.query.filter(Album.albumArtId == None).count()

    # Sample album data
    sample_albums = Album.query.limit(5).all()
    album_data = [{
        'id': a.id,
        'name': a.name,
        'albumArtId': a.albumArtId,
        'hasArt': a.albumArt is not None
    } for a in sample_albums]

    return jsonify({
        'totalAlbumArt': art_count,
        'albumsWithArt': albums_with_art,
        'albumsWithoutArt': albums_without_art,
        'sampleAlbums': album_data
    })


if __name__ == '__main__':
    with app.app_context():
        # Create all tables
        db.create_all()
    app.run(debug=True)
