## audiolibrary

Web application to manage and and build (not play) your playlists. Recursively searches and reads your audio files from a targeted folder(s), retrieving metadata for display in a layout similar to iTunes. Allows for drag and drop into playlist which then saves into .fpl or .m3u8 playlists files for your media player.

Planning to port to Electron to allow for direct access to local audio files without browser limitation.

### Current Features

Typical media library manager things:

- **full listing of tracks in folder(s):** view all your tracks
- **artist search:** searchbar for artists;
- **artist + album page:** filter albums by artists
  - **album information:** view album art, album title, artist, year, genre, and total album runtime

### Stack

- **frontend:** angular + tailwind
- **backend:** flask
- **database:** sqlalchemy
- **metadata extract:** [mutagen](https://mutagen.readthedocs.io/en/latest/)

### Run

Separate Flask App + Angular frontend until I port it over to Electron:

Angular:
`brew install angular-cli`
`cd frontend`
`ng serve`

Flask:
`pip install -r backend/requirements.txt`
`python backend/app.py`

### Work in Progress

- **sliding metadata panel:** seamlessly pop in metadata from the right and hides after
- **playlists:** Drag and drop selected tracks in to playlist boxes
- **overall searchbar:** somewhere on top left or top
  - **spotlight search:** powertoys/macbook spotlight search, alt+space or alt+k or something
