import mongoose from 'mongoose';

const audioTrackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, default: 'Magis' },
  audioUrl: { type: String, required: true },
  coverUrl: { type: String },
  genre: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('AudioTrack', audioTrackSchema);
