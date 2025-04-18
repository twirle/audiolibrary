from datetime import datetime
import os
from threading import Thread
from flask import Flask, jsonify, request, current_app
from flask_cors import CORS
from flask_migrate import Migrate
from models import Setting, db, Artist, Album, Genre, AlbumArt, Track, GenreAlias, init_db
from load import scanLibrary
from config import Config
from sqlalchemy import func

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
init_db(app)
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
            'albumId': t.album.id,
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
    artist = Artist.query.options(
        db.joinedload(Artist.albums).joinedload(Album.albumArt)
    ).get_or_404(artist_id)

    return jsonify(artist.serialize(include_albums=True, include_genres=True))


@app.route('/api/albums/<int:album_id>')
def getAlbum(album_id):
    album = Album.query.options(
        db.joinedload(Album.artist),
        db.joinedload(Album.albumArt)
    ).get_or_404(album_id)

    # tracks = Track.query.filter_by(albumId=album.id).order_by(Track.trackNumber).all()

    return jsonify(album.serialize(include_tracks=True, include_artist=True))


@app.route('/api/debug/album-art')
def debugAlbumArt():
    artCount = AlbumArt.query.count()
    albumsWithArt = Album.query.filter(Album.albumArtId != None).count()
    albumsWithoutArt = Album.query.filter(Album.albumArtId == None).count()

    # Sample album data
    sample_albums = Album.query.limit(5).all()
    album_data = [{
        'id': a.id,
        'name': a.name,
        'albumArtId': a.albumArtId,
        'hasArt': a.albumArt is not None
    } for a in sample_albums]

    return jsonify({
        'totalAlbumArt': artCount,
        'albumsWithArt': albumsWithArt,
        'albumsWithoutArt': albumsWithoutArt,
        'sampleAlbums': album_data
    })


@app.route('/api/genres')
def getGenres():
    genres = Genre.query.all()
    return jsonify([genre.serialize() for genre in genres])


@app.route('/api/genres/search')
def searchGenres():
    searchTerm = request.args.get('term', '').lower()

    # search for exact matches
    aliases = GenreAlias.query.filter(
        func.lower(GenreAlias.alias).contains(searchTerm)).all()
    genreIds = [alias.genreId for alias in aliases]

    # add direct matches
    directMatches = Genre.query.filter(
        func.lower(Genre.name).contains(searchTerm)).all()
    for genre in directMatches:
        if genre.id not in genreIds:
            genreIds.append(genre.id)

    genres = Genre.query.filter(Genre.id.in_(genreIds)).all()

    return jsonify([genre.serialize() for genre in genres])


@app.route('/api/get-audio-directory')
def getAudioDirectory():
    path = Setting.get('audio_directory', app.config.get('AUDIO_DIRECTORY'))
    return jsonify({'path': path})


@app.route('/api/set-audio-directory', methods=['POST'])
def setAudioDirectory():
    path = request.json.get('path')

    # check path exists
    if not os.path.exists(path):
        return jsonify({'error': 'Directory not found'}), 400

    # store path in dataabse
    Setting.set('audio_directory', path)

    # update running config
    app.config['AUDIO_DIRECTORY'] = path
    return jsonify({'success': True})


@app.route('/api/scan-library', methods=['POST'])
def handleScanLibrary():
    requestData = request.get_json()
    path = requestData.get('path')

    # path from settings
    if not path:
        path = Setting.get('music_folder', current_app.config['MUSIC_FOLDER'])

    # check path exist
    if not os.path.exists(path):
        return jsonify({'error': 'Invalid directory'}), 400

    # run in background thread, KEEP THE ',' AFTER PATH; args=(path, )
    Thread(target=scanLibrary, args=(path,), daemon=True).start()

    return jsonify({
        'status': 'started',
        'path': path,
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
