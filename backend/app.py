from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
from tinytag import TinyTag, TinyTagException
import base64

app = Flask(__name__)
CORS(app)

AUDIO_DIRECTORY = "/mnt/h/FLAC Music/Tatsuro Yamashita (山下達郎)"
audio_folder = '/mnt/h/FLAC Music'
app.config['UPLOAD_FOLDER'] = 'uploads'
ALLOWED_EXTENSIONS = TinyTag.SUPPORTED_FILE_EXTENSIONS


def allowed_file(filepath):
    return TinyTag.is_supported(filepath)


def extract_metadata(filepath):
    filename = filepath.split('/')[-1]
    print(f"Processing file: {filename}")
    try:
        tag = TinyTag.get(filepath, image=True)
        metadata = {
            'filepath': filepath,
            'filename': filename,
            'filesize': tag.filesize,
            'title': tag.title,
            'artist': tag.artist,
            'album': tag.album,
            'genre': tag.genre,
            'duration': tag.duration,
            'bitrate': tag.bitrate,
            'samplerate': tag.samplerate,
            'track': tag.track,
            'trackTotal': tag.track_total,
            'year': tag.year,
            'images': []
        }

        image = tag.images.any

        if image:  # Check if an image was found
            metadata['images'] = [{  # Create a list with a single image dictionary
                'data': base64.b64encode(image.data).decode('utf-8'),
                'mime_type': image.mime_type
            }]
        else:
            metadata['images'] = []  # If no image, keep images as empty list

        # Log missing metadata fields (as before)
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

# --- API Endpoints ---


@app.route('/api/audio-metadata')
def get_audio_metadata():
    audio_metadata_list = []
    print("Starting metadata extraction process...")  # LOG: Start of API call
    for root, dirs, files in os.walk(AUDIO_DIRECTORY):
        for file in files:
            if allowed_file(file):
                filepath = os.path.join(root, file)
                metadata = extract_metadata(filepath)
                if 'error' not in metadata:
                    audio_metadata_list.append(metadata)
    # LOG: End of API call and track count
    print(
        f"Finished metadata extraction. Total tracks processed: {len(audio_metadata_list)}")
    return jsonify(audio_metadata_list)


# ---  Serve Static Files (Optional) ---
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


if __name__ == '__main__':
    app.run(debug=True)
