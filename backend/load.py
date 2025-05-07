import base64
from datetime import datetime
import os
import hashlib
from pathlib import Path
from flask import current_app
from mutagen import File
from sqlalchemy import inspect, text
from thefuzz import fuzz
from config import Config
from models import db, Artist, Album, Genre, AlbumArt, Track, Genre, GenreAlias

genreNormalisation = {
    'jpop': 'J-Pop',
    'j-pop': 'J-Pop',
    'j pop': 'J-Pop',
    'j rock': 'J-Rock',
    'j-rock': 'J-Rock',
    'jrock': 'J-Rock',
}


def normaliseGenre(genre):
    if not genre:
        return None

    genre = genre.strip()
    lowerName = genre.lower()

    # check direct matches
    if lowerName in genreNormalisation:
        return genreNormalisation[lowerName]

    # check aliases from database
    alias = GenreAlias.query.filter_by(alias=lowerName).first()
    if alias:
        return alias.genre.name

    # fuzz match against existing genres
    allGenres = Genre.query.all()
    bestMatch = None
    bestScore = 0

    for genre in allGenres:
        score = fuzz.ratio(lowerName, genre.name.lower())
        if score > 85 and score > bestScore:
            bestScore = score
            bestMatch = genre.name

    if bestMatch:
        # add as new alias
        addGenreAlias(lowerName, bestMatch)
        return bestMatch

    # fallback to title as base
    return genre.title()


def extractMetadata(audio, filepath):
    # extract basic metadata
    title = (audio.get('title', [''])[0]
             or '').strip() or os.path.basename(filepath)
    artistName = (audio.get('artist', [''])[
                  0] or '').strip() or 'Unknown Artist'
    albumName = (audio.get('album', [''])[0] or '').strip() or 'Unknown Album'

    # extract genre metadata safely
    rawGenre = audio.get('genre')
    genreName = None
    if rawGenre:
        if isinstance(rawGenre, list) and len(rawGenre) > 0:
            genreName = str(rawGenre[0]).strip() or None
        elif isinstance(rawGenre, str):
            genreName = rawGenre.strip() or None
        else:
            genreName = str(rawGenre).strip() or None

    # parse year
    year = None
    rawDate = audio.get('date')
    if rawDate:
        try:
            dateStr = rawDate[0] if isinstance(rawDate, list) else str(rawDate)
            year = int(dateStr[:4]) if dateStr.strip() else None
        except (ValueError, IndexError):
            pass

    # extract track number
    trackNumber = 0
    trackNumberRaw = audio.get('tracknumber', ['0'])[0]
    try:
        trackNumber = int(trackNumberRaw.split('/')[0])
    except (ValueError, AttributeError):
        pass

    return {
        'title': title,
        'artistName': artistName,
        'albumName': albumName,
        'genreName': genreName,
        'year': year,
        'trackNumber': trackNumber
    }


def getOrCreateArtist(artistName):
    artist = db.session.query(Artist).filter_by(name=artistName).first()
    if not artist:
        artist = Artist(name=artistName)
        db.session.add(artist)
        db.session.flush()
    return artist


def getOrCreateGenre(genreName):
    if not genreName:
        return None

    normalisedGenre = normaliseGenre(genreName)
    if not normalisedGenre:
        return None

    genre = db.session.query(Genre).filter_by(name=normalisedGenre).first()
    if not genre:
        genre = Genre(name=normalisedGenre)
        db.session.add(genre)
        db.session.flush()
    return genre


def processAlbumArt(audio, albumName):
    if not hasattr(audio, 'pictures'):
        return None

    for picture in audio.pictures:
        if picture.type == 3:  # front cover
            current_app.logger.info(f"Found cover art for {albumName}")
            imageData = base64.b64encode(picture.data).decode('utf-8')
            imageHash = hashlib.sha256(picture.data).hexdigest()

            albumArt = db.session.query(
                AlbumArt).filter_by(hash=imageHash).first()
            if not albumArt:
                albumArt = AlbumArt(
                    hash=imageHash,
                    mimeType=picture.mime,
                    data=imageData
                )
                db.session.add(albumArt)
                db.session.flush()
                current_app.logger.info(
                    f"Created new AlbumArt with ID: {albumArt.id}")
            return albumArt
    return None


def getOrCreateAlbum(albumName, artistId, year, albumArt):
    album = db.session.query(Album).filter_by(
        name=albumName, artistId=artistId).first()
    if not album:
        album = Album(
            name=albumName,
            artistId=artistId,
            year=year,
            albumArtId=albumArt.id if albumArt else None
        )
        db.session.add(album)
        db.session.flush()
    return album


def createTrack(metadata, artistId, albumId, genreId, filepath, audioInfo):
    track = Track(
        title=metadata['title'],
        artistId=artistId,
        albumId=albumId,
        genreId=genreId,
        duration=float(audioInfo.length) if audioInfo else None,
        bitrate=int(audioInfo.bitrate) if audioInfo and hasattr(
            audioInfo, 'bitrate') else None,
        trackNumber=metadata['trackNumber'],
        year=metadata['year'],
        filepath=filepath
    )
    return track


def processFile(filepath):
    try:
        audio = File(filepath)
        if not audio:
            return None

        # extract all metadata
        metadata = extractMetadata(audio, filepath)

        # process each component
        artist = getOrCreateArtist(metadata['artistName'])
        genre = getOrCreateGenre(metadata['genreName'])
        albumArt = processAlbumArt(audio, metadata['albumName'])
        album = getOrCreateAlbum(
            metadata['albumName'], artist.id, metadata['year'], albumArt)

        # create the track
        track = createTrack(metadata, artist.id, album.id,
                            genre.id if genre else None, filepath, audio.info)

        return track
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error processing {filepath}: {str(e)}")
        return None


def scanLibrary(path, cancelEvent=None):
    from app import app, scanStatus
    from sqlalchemy import select

    # Helper function to update status and return result
    def updateStatus(status_type, message=None, **stats):
        result = {
            'status': status_type,
            **(stats if stats else {
                'total': total_files,
                'success': success_count,
                'errors': error_count,
                'removed': deleted_count
            })
        }

        if message:
            result['message'] = message

        # Update global scan status
        scanStatus["isScanning"] = False
        scanStatus["lastResult"] = result
        scanStatus["completedTime"] = datetime.now().isoformat()

        app.logger.info(f"Scan {status_type}: {result}")
        return result

    # Initialize scan
    scanStatus["isScanning"] = True
    scanStatus["startTime"] = datetime.now().isoformat()
    scanStatus["lastResult"] = None

    with app.app_context():
        total_files = 0
        success_count = 0
        error_count = 0
        deleted_count = 0

        try:
            # Validate path
            if not any(path.startswith(p) for p in app.config['ALLOWED_PATHS']):
                app.logger.error(f"Unauthorized scan path: {path}")
                return updateStatus('error', 'Path not allowed')

            # Phase 1: Process files
            for root, _, files in os.walk(path):
                # check for cancellation
                if cancelEvent and cancelEvent.is_set():
                    app.logger.info(
                        "Scan cancelled during directory traversal")
                    return updateStatus('cancelled', 'Scan cancelled during directory traversal')

                for file in files:
                    # check for cancellation before processing each file
                    if cancelEvent and cancelEvent.is_set():
                        app.logger.info(
                            "Scan cancelled during file processing")
                        return updateStatus('cancelled', 'Scan cancelled during file processing')

                    if file.lower().endswith(('.flac', '.mp3', '.wav')):
                        total_files += 1
                        filepath = os.path.join(root, file)

                        try:
                            # Check existing track using exists()
                            exists = db.session.query(
                                Track.id
                            ).filter_by(filepath=filepath).scalar()

                            if exists:
                                continue

                            with db.session.begin_nested():
                                track = processFile(filepath)
                                if track:
                                    db.session.add(track)
                                    success_count += 1

                                    if track.genre:
                                        updateSourceGenre(
                                            filepath, track.genre.name)

                            # Batch processing
                            if total_files % 100 == 0:
                                db.session.flush()

                        except Exception as e:
                            db.session.rollback()
                            error_count += 1
                            app.logger.error(
                                f"Error processing {filepath}: {str(e)}")

            # Final commit for processed files
            db.session.commit()

            # check for cancellation before cleanup
            if cancelEvent and cancelEvent.is_set():
                app.logger.info("Scan cancelled before cleanup")
                return updateStatus('cancelled', 'Scan cancelled before cleanup')

            # Phase 2: Cleanup deleted files
            stmt = select(Track.id, Track.filepath).execution_options(
                yield_per=1000)
            deleted_count = 0

            for row in db.session.execute(stmt):
                try:
                    # Check if file exists AND starts with the current scan path
                    if not Path(row.filepath).exists() or not row.filepath.startswith(path):
                        track = db.session.get(Track, row.id)
                        if track:
                            db.session.delete(track)
                            deleted_count += 1

                            if deleted_count % 100 == 0:
                                db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    app.logger.error(
                        f"Error deleting track {row.id}: {str(e)}")

            # Final commit for deletions
            db.session.commit()

            # Success case
            return updateStatus('success')

        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Scan aborted: {str(e)}")

            # Error case with partial results
            return updateStatus('error', str(e), partial_results={
                'total': total_files,
                'success': success_count,
                'errors': error_count,
                'removed': deleted_count
            })


def clearDatabase():
    try:
        db.session.close()
        db.engine.dispose()

        with current_app.app_context():
            db.drop_all()
            db.create_all()

        current_app.logger.info("Database successfully reset")
        return True
    except Exception as e:
        current_app.logger.error(f"Error clearing database: {str(e)}")
        return False


def main():
    from app import app
    app.config.from_object(Config)

    with app.app_context():
        # initialise db
        db.create_all()

        # scan default directory
        scanLibrary(app, Config.AUDIO_DIRECTORY)


if __name__ == "__main__":
    main()
