import base64
import os
import hashlib
from flask import Flask
from mutagen import File
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

    if lowerName in genreNormalisation:
        return genreNormalisation[lowerName]

    for alias, canonical in genreNormalisation.items():
        if fuzz.ratio(lowerName, alias) > 80:
            return canonical

    return genre.title()


def processFile(filepath):
    try:
        audio = File(filepath)
        if not audio:
            return None

        # extract basic metadata
        title = (audio.get('title', [''])[0] or '').strip(
        ) or os.path.basename(filepath)
        artistName = (audio.get('artist', [''])[
                      0] or '').strip() or 'Unknown Artist'
        albumName = (audio.get('album', [''])[
                     0] or '').strip() or 'Unknown Album'
        genreName = (audio.get('genre', [''])[0] or '').strip() or None

        # get or create artist
        artist = Artist.query.filter_by(name=artistName).first()
        if not artist:
            artist = Artist(name=artistName)
            db.session.add(artist)
            db.session.flush()

        # get or create genre
        normalisedGenre = normaliseGenre(genreName)
        genre = Genre.query.filter_by(name=normalisedGenre).first()
        if not genre and normalisedGenre:
            genre = Genre(name=normalisedGenre)
            db.session.add(genre)
            db.session.flush

        # genre = None
        # if genreName:
        #     normalizedGenre = normalizeGenre(genreName)
        #     genre = Genre.query.filter_by(name=normalizedGenre).first()
        #     if not genre:
        #         genre = Genre(name=normalizedGenre)
        #         db.session.add(genre)
        #         db.session.flush()

        # parse year
        year = None
        rawDate = audio.get('date')
        if rawDate:
            try:
                dateStr = rawDate[0] if isinstance(
                    rawDate, list) else str(rawDate)
                year = int(dateStr[:4]) if dateStr.strip() else None
            except (ValueError, IndexError):
                pass

        # process album art
        albumArt = None
        if hasattr(audio, 'pictures'):
            for picture in audio.pictures:
                if picture.type == 3:  # Front cover
                    print(f"Found cover art for {albumName}")

                    imageData = base64.b64encode(picture.data).decode('utf-8')
                    imageHash = hashlib.sha256(picture.data).hexdigest()

                    albumArt = AlbumArt.query.filter_by(hash=imageHash).first()
                    if not albumArt:
                        albumArt = AlbumArt(
                            hash=imageHash,
                            mimeType=picture.mime,
                            data=imageData
                        )
                        db.session.add(albumArt)
                        db.session.flush()
                    print(f"Created new AlbumArt with ID: {albumArt.id}")
                break

        # get or create album
        album = Album.query.filter_by(
            name=albumName, artistId=artist.id).first()
        if not album:
            album = Album(
                name=albumName,
                artistId=artist.id,
                year=year,
                albumArtId=albumArt.id if albumArt else None
            )
            db.session.add(album)
            db.session.flush()

        # create track
        trackNumber = None
        trackNumberRaw = audio.get('tracknumber', ['0'])[0]
        try:
            trackNumber = int(trackNumberRaw.split('/')[0])
        except (ValueError, AttributeError):
            trackNumber = 0

        track = Track(
            title=title,
            artistId=artist.id,
            albumId=album.id,
            genreId=genre.id if genre else None,
            duration=float(audio.info.length) if audio.info else None,
            bitrate=int(audio.info.bitrate) if audio.info and hasattr(
                audio.info, 'bitrate') else None,
            trackNumber=trackNumber,
            year=year,
            filepath=filepath
        )

        return track
    except Exception as e:
        print(f"Error processing {filepath}: {str(e)}")
        return None


def addGenreAlias(alias, canonical):
    genre = Genre.query.filter_by(name=canonical).first()
    if not genre:
        return
    existingAlias = GenreAlias.query.filter_by(alias=alias.lower()).first()

    if not existingAlias:
        aliasEntry = GenreAlias(alias=alias.lower(), genreId=genre.id)
        db.session.add(aliasEntry)


def updateSourceGenre(filepath, normalisedGenre):
    try:
        audio = File(filepath, easy=True)

        # check if update req
        currentGenre = audio.get('genre', [''][0])
        if currentGenre != normalisedGenre:
            audio['genre'] = normalisedGenre
            audio.save()

    except Exception as e:
        print("error updating genre in {filepath}: {str(e)}")


def main():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)

    with app.app_context():
        db.create_all()

        count = 0
        successCount = 0
        errorCount = 0

        for root, _, files in os.walk(Config.AUDIO_DIRECTORY):
            for file in files:
                if file.lower().endswith(('.flac', '.mp3', '.wav')):
                    filepath = os.path.join(root, file)
                    count += 1

                    try:
                        with db.session.begin_nested():  # savepoint
                            track = processFile(filepath)
                            if track:
                                db.session.add(track)
                                print(f"✓ Processed [{count}]: {filepath}")
                                successCount += 1
                    except Exception as e:
                        db.session.rollback()
                        print(f"✗ Error [{count}]: {filepath} - {str(e)}")
                        errorCount += 1

                    # commit every 100 tracks to avoid large transactions
                    if count % 100 == 0:
                        db.session.commit()
                        print(f"Committed batch: {count} tracks processed")

        # final commit
        try:
            db.session.commit()
            print(f"Database populated successfully!")
            print(
                f"Total: {count} | Success: {successCount} | Errors: {errorCount}")
        except Exception as e:
            db.session.rollback()
            print(f"Final commit failed: {str(e)}")


if __name__ == "__main__":
    main()
