# audiolibrary

Web application to manage and and build (not play) your playlists. Recursively searches and reads your audio files from a targeted folder(s), retrieving metadata for display in a layout similar to iTunes. Allows for drag and drop into playlist which then saves into .fpl or .m3u8 playlists files for your media player.

Planning to port to Electron to allow for direct access to local audio files without browser limitation.

## Current Features

What you would expect from iTunes:

- **Album Pages:** Clicking on an album name takes you to a dedicated album page.
- **Album Information:** View album art, album title, artist, year, genre, and total album runtime.
- **Track Listing and Metadata Display:** See a clear, column-based list of tracks for the selected album, including track number, title, duration, and actions.
- **Search Bar:** Search for tracks, albums, or artists within library.
- **Track Playback:** Not intended to implement as I am using foobar2000 with a nice skin already, but perhaps in future.

## Run

Until it gets ported over to Electron:

Angular:
`cd frontend`
`ng serve`

Flask:
`python backend/app.py`

## Stack

- **Frontend:** Angular
- **Backend:** Flask
- **Metadata Extraction:** [TinyTags](https://github.com/tinytag/tinytag)

## Work in Progress

- **Artist Pages:** Clicking on an album name takes you to a dedicated album page.
- **Side Navigation Panel:** Side navigation panel to organise navigation.
- **Sliding Metadata Panel:** Seamlessly pop up metadata from the right and hides after. (No clicking of 'Properties' and waiting 5s to load (cough itunes))
- **Playlists:** Drag and drop selected tracks in to playlist boxes
- **Visuals:** Implement Material Design library
