import axios from "axios";

export const searchArtists = async (token, searchKey) => {
    try {
        const res = await axios.get("https://api.spotify.com/v1/search", {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {
                q: searchKey,
                type: "artist",
                limit: 30
            }
        })
        return { data: res.data.artists.items, error: null };
    } catch (error) {
        return { data: null, error: error };
    }
}

export const searchTracks = async (token, searchKey) => {
    try {
        const res = await axios.get("https://api.spotify.com/v1/search", {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {
                q: searchKey,
                type: "track",
                limit: 30
            }
        })
        return { data: res.data.tracks.items, error: null };
    } catch (error) {
        return { data: null, error: error };
    }
}

export const createPlaylist = async (token) => {
    try {
        const meRes = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const userId = meRes.data.id;

        const createPlaylistRes = await axios.post(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            name: "Your New Playlist",
            description: "Generated by BeatBot",
            public: true
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return { playlistId: createPlaylistRes.data.id, error: null };
    } catch (error) {
        return { playlistId: null, error: error };
    }

};

export const addTracks = async (token, playlistId, recommendations) => {
    try {
        await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            uris: recommendations
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
        );
        return { error: null };
    } catch (error) {
        return { error: error };
    }
}

const getCriteria = async (token, selectedArtists, selectedTracks) => {
    try {
        // fetch desireable features from the seeds
        let criteria = new Map();

        for (let artist of selectedArtists) {
            const artistRes = await axios.get(`https://api.spotify.com/v1/artists/${artist}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const artistData = artistRes.data;

            criteria.set(artist, 1);

            for (let genre of artistData.genres) {
                if (criteria.has(genre)) {
                    criteria.set(genre, criteria.get(genre) + 1);
                } else {
                    criteria.set(genre, 1);
                }
            }
        }

        for (let track of selectedTracks) {
            const trackRes = await axios.get(`https://api.spotify.com/v1/tracks/${track}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const trackData = trackRes.data;

            for (let artist of trackData.artists) {
                if (criteria.has(artist.id)) {
                    criteria.set(artist.id, criteria.get(artist.id) + 1);
                } else {
                    criteria.set(artist.id, 1);
                }

                const artistRes = await axios.get(`https://api.spotify.com/v1/artists/${artist.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const artistData = artistRes.data;

                for (let genre of artistData.genres) {
                    if (criteria.has(genre)) {
                        criteria.set(genre, criteria.get(genre) + 1);
                    } else {
                        criteria.set(genre, 1);
                    }
                }
            }
        }
        return { criteria: criteria, error: null};
    } catch (error) {
        return { criteria: null, error: error };
    }
}

export const getRecommendations = async (token, selectedArtists, selectedTracks) => {
    try {
        const { criteria, error } = await getCriteria(token, selectedArtists, selectedTracks);
        if (error) {
            throw error;
        }
        const res = await axios.get(`https://api.spotify.com/v1/recommendations?seed_artists=${selectedArtists}&seed_tracks=${selectedTracks}&limit=30`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(res.data.tracks)
        const recommendationURIs = res.data.tracks.map(track => track.uri);
        console.log(recommendationURIs)
        return { recommendationURIs: recommendationURIs, error: null }
    } catch (error) {
        return { recommendationURIs: null, error: error };
    }
}