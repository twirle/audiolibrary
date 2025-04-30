## audiolibrary

Web application to manage and and build your playlists. Recursively searches and reads your audio files from a targeted folder(s), retrieving metadata for display in a layout similar to iTunes. Allows for drag and drop into playlist which then saves into .fpl or .m3u8 playlists files for your media player.

Planning to port to Electron to allow for direct access to local audio files without address.

### Current Features

- **full listing of tracks in source directory**
  - change source directory in settings page (requires copy paste of current directory for now)
- **track/album/artist search:** alt+k for searchbar;
- **artist + album page:**
  - **album information:** view album art, album title, artist, year, genre, and total album runtime
  - **artist filter** search specifically for an artist and display all albums from that artist

### Stack

- **frontend:** angular + tailwind
- **backend:** flask
- **database:** sqlalchemy
- **metadata extract:** [mutagen](https://mutagen.readthedocs.io/en/latest/)

### Run

Separate Flask App + Angular frontend until I wrap up main features and port it over to Electron:

Angular:
`cd frontend`
`ng serve`

Flask:
`pip install -r backend/requirements.txt`
`python backend/app.py`

### Work in Progress

- **sliding metadata panel:** seamlessly pop in metadata from the right and hides after
- **playlists:** drag and drop selected tracks in to playlist boxes
- **integration with LLM:** recommend/generate playlist based on genre/artist/year input
