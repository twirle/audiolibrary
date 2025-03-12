from flask import Flask, jsonify
from flask_cors import CORS
import os
from tinytag import TinyTag, TinyTagException
import base64
import time
import sys

app = Flask(__name__)
CORS(app)

AUDIO_DIRECTORY = "/mnt/h/FLAC Music/Tatsuro Yamashita (山下達郎)"
ALLOWED_EXTENSIONS = TinyTag.SUPPORTED_FILE_EXTENSIONS


# cache variables
audioMetadataCache = {}
cachedFilePaths = set()
cacheTimestamp = 0
cacheExpiryTimeSeconds = 60 * 5
lastFileChange = 0


def allowedFile(filepath):
    return TinyTag.is_supported(filepath)


def extractMetadata(filepath):
    filename = filepath.split('/')[-1]
    print(f"Processing file: {filename}")
    try:
        tag = TinyTag.get(filepath, image=True)
        metadata = {
            'filepath': filepath,
            'filename': filename,
            # 'filesize': tag.filesize,
            'title': tag.title,
            'artist': tag.artist,
            'album': tag.album,
            'genre': tag.genre,
            'duration': tag.duration,
            # 'bitrate': tag.bitrate,
            # 'samplerate': tag.samplerate,
            'track': tag.track,
            'trackTotal': tag.track_total,
            'year': tag.year,
            'images': []
        }

        image = tag.images.any

        if image:
            metadata['images'] = [{
                'data': base64.b64encode(image.data).decode('utf-8'),
                'mime_type': image.mime_type
            }]
        else:
            metadata['images'] = []

        # Log missing metadata fields
        if not metadata.get('title'):
            print(f"Warning: Missing 'title' metadata for {filename}")
        if not metadata.get('artist'):
            print(f"Warning: Missing 'artist' metadata for {filename}")
        if not metadata.get('album'):
            print(f"Warning: Missing 'album' metadata for {filename}")

        print(f"Successfully extracted metadata for: {filename}")
        return metadata

    except TinyTagException as e:
        print(
            f"ERROR: TinyTagException: {e}, Filename: {filename}, Filepath: {filepath}")
        return {'error': f"Could not read metadata: {e}", 'filename': filename, 'filepath': filepath}
    except Exception as e:
        print(
            f"ERROR: Unexpected error: {e}, Filename: {filename}, Filepath: {filepath}")
        return {'error': f"An unexpected error occurred: {e}", 'filename': filename, 'filepath': filepath}


@app.route('/api/audio-metadata')
def getAudioMetadata():
    global audioMetadataCache, cacheTimestamp, lastFileChange, cachedFilePaths
    currentTime = time.time()
    currentDirectoryChange = os.path.getmtime(AUDIO_DIRECTORY)

    # check cache expiry from cache timestamp and directory
    if audioMetadataCache and \
        (currentTime - cacheTimestamp) < cacheExpiryTimeSeconds and \
            currentDirectoryChange == lastFileChange:
        print(f"Retrieving metadata from cache")
        return jsonify(list(audioMetadataCache.values()))

    currentFilePaths = set()
    audioMetadataList = []

    # extract metadata
    for root, dirs, files in os.walk(AUDIO_DIRECTORY):
        for file in files:
            filepath = os.path.join(root, file)

            if allowedFile(filepath):
                currentFilePaths.add(filepath)

                # check if filepath in cached filepaths
                if filepath not in cachedFilePaths:
                    print(f"New file found: {filepath}; extracting metadata")
                    metadata = extractMetadata(filepath)

                    if 'error' not in metadata:
                        # add to cache
                        audioMetadataCache[filepath] = metadata
                        audioMetadataList.append(metadata)

    # clearing missing files
    removedFilePaths = cachedFilePaths - currentFilePaths
    for filepath in removedFilePaths:
        print(f"File removed from cache: {filepath}")
        if filepath in audioMetadataCache:
            del audioMetadataCache[filepath]

    # update cache with current list
    cacheTimestamp = currentTime
    lastFileChange = currentDirectoryChange
    cachedFilePaths = currentFilePaths
    print(f"Total tracks processed: {len(audioMetadataList)}")
    print(f"Last directory change", currentDirectoryChange)
    print(f"Last file change", lastFileChange)
    print(f"Cache size", sys.getsizeof(audioMetadataCache))

    return jsonify(list(audioMetadataCache.values()))


if __name__ == '__main__':
    app.run(debug=True)
