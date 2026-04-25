import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Helpers: map backend shape → frontend shape ──────────────────────────────

/** Backend song → player-compatible song */
export function normalizeSong(s) {
  if (!s) return null;
  return {
    id:       s._id,
    name:     s.title,
    singer:   s.artist?.name ?? s.artist ?? '',
    src_img:  s.coverImage ?? '',
    url:      s.audioUrl ?? '',
    duration: s.duration,
    playCount: s.playCount ?? 0,
    genre:    s.genre ?? [],
    artistId:  s.artist?._id ?? s.artist,
    albumId:   s.album?._id ?? s.album,
    copyright: s.copyright && typeof s.copyright === 'object'
      ? s.copyright
      : { owner: '', license: 'All rights reserved', year: null, status: 'active', expiresAt: null },
  };
}

/** Backend album → component-compatible album */
export function normalizeAlbum(a) {
  if (!a) return null;
  return {
    id:       a._id,
    name:     a.title,
    singer:   a.artist?.name ?? a.artist ?? '',
    image:    a.coverImage ?? '',
    songs:    (a.songs ?? []).map(normalizeSong),
    releaseYear: a.releaseYear,
    artistId: a.artist?._id ?? a.artist,
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:         (email, password)           => api.post('/auth/login',          { email, password }),
  register:      (username, email, password) => api.post('/auth/register',       { username, email, password }),
  forgotPassword:(email)                     => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, otp, newPassword)   => api.post('/auth/reset-password', { email, otp, newPassword }),
  verifyEmail:   (email, otp)               => api.post('/auth/verify-email',    { email, otp }),
};

// ── Songs ─────────────────────────────────────────────────────────────────────
export const songAPI = {
  getAll:    (page = 1, limit = 20)  => api.get('/songs',          { params: { page, limit } }),
  getById:   (id)                    => api.get(`/songs/${id}`),
  getTrending:()                     => api.get('/songs/trending'),
  search:    (keyword)               => api.get('/songs/search',   { params: { keyword } }),
  create:    (formData)              => api.post('/songs',         formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:    (id, data)              => api.put(`/songs/${id}`,    data),
  delete:    (id)                    => api.delete(`/songs/${id}`),
  play:      (id)                    => api.put(`/songs/${id}/play`),
  recommend: (id, excludeIds = [])   => api.get(`/songs/${id}/recommend`, { params: { exclude: excludeIds.join(',') } }),
};

// ── Artists ───────────────────────────────────────────────────────────────────
export const artistAPI = {
  getAll:  ()          => api.get('/artists'),
  getById: (id)        => api.get(`/artists/${id}`),
  getSongs:(id)        => api.get(`/artists/${id}/songs`),
  create:  (data)      => api.post('/artists',      data),
  update:  (id, data)  => api.put(`/artists/${id}`, data),
  delete:  (id)        => api.delete(`/artists/${id}`),
};

// ── Albums ────────────────────────────────────────────────────────────────────
export const albumAPI = {
  getAll:    ()          => api.get('/albums'),
  getById:   (id)        => api.get(`/albums/${id}`),
  create:    (data)      => api.post('/albums',           data),
  update:    (id, data)  => api.put(`/albums/${id}`,     data),
  delete:    (id)        => api.delete(`/albums/${id}`),
  addSong:   (id, songId)    => api.post(`/albums/${id}/songs`,            { songId }),
  removeSong:(id, songId)    => api.delete(`/albums/${id}/songs/${songId}`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getMe:           ()              => api.get('/user/me'),
  updateMe:        (data)          => api.put('/user/me',              data),
  changePassword:  (oldPassword, newPassword) => api.put('/user/change-password', { oldPassword, newPassword }),
  getLibrary:      ()              => api.get('/user/library'),
  followArtist:    (artistId)      => api.post(`/user/follow-artist/${artistId}`),
  saveAlbum:       (albumId)       => api.post(`/user/save-album/${albumId}`),
  getAll:          ()              => api.get('/user'),
  delete:          (id)            => api.delete(`/user/${id}`),
  recordPlay:      (songId)        => api.post(`/user/recently-played/${songId}`),
  getRecentlyPlayed: ()            => api.get('/user/recently-played'),
};

export default api;
