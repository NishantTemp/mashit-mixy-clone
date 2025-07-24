import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Mock data
const songs = [
  { id: 1, title: "Summer Nights", artist: "Luna Bay", image: "photo-1618160702438-9b02ab6515c9" },
  { id: 2, title: "Electric Dreams", artist: "Neon Waves", image: "photo-1535268647677-057b9d5e3905" },
  { id: 3, title: "City Lights", artist: "Urban Echo", image: "photo-1582562124811-c09040d0a901" },
];

// GET /api/songs endpoint
app.get('/api/songs', (req, res) => {
  res.json(songs);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
