// ─── magis-studio/backend/src/models/GearItem.model.js ───────────────────────
//
//  POLYMORPHIC SCHEMA DESIGN
//  ─────────────────────────
//  GearItem uses a discriminator-based pattern (via `category` field + 
//  `specs` Mixed type) to handle the vastly different technical specifications
//  across gear types:
//
//  • Studio Monitors  → frequency response, SPL, drivers, crossover
//  • Audio Interfaces → I/O count, preamps, AD/DA converters, latency
//  • Mixing Consoles  → channel count, bus architecture, motorized faders
//  • Headphones       → impedance, driver type, THD, sensitivity
//  • DAC/Amplifiers   → THD+N, SNR, output power, topology
//  • Microphones      → polar pattern, self-noise, max SPL, capsule
//  • Cables & Accessories → material, connectors, gauge
//
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// ─── Sub-Schemas ──────────────────────────────────────────────────────────────

const mediaAssetSchema = new Schema({
  url:       { type: String, required: true },
  publicId:  { type: String, required: true }, // Cloudinary public_id
  alt:       { type: String, default: '' },
  type:      { type: String, enum: ['image', 'video', 'thumbnail'], default: 'image' },
  isPrimary: { type: Boolean, default: false },
  order:     { type: Number, default: 0 },
}, { _id: true });

const reviewScoreSchema = new Schema({
  build:        { type: Number, min: 0, max: 10 },
  sound:        { type: Number, min: 0, max: 10 },
  features:     { type: Number, min: 0, max: 10 },
  valueForMoney:{ type: Number, min: 0, max: 10 },
  innovation:   { type: Number, min: 0, max: 10 },
  overall:      { type: Number, min: 0, max: 10 },
}, { _id: false });

const prosConsSchema = new Schema({
  pros: [{ type: String, maxlength: 200 }],
  cons: [{ type: String, maxlength: 200 }],
}, { _id: false });

const priceHistorySchema = new Schema({
  price:     { type: Number, required: true },
  currency:  { type: String, default: 'USD', maxlength: 3 },
  recordedAt:{ type: Date, default: Date.now },
  source:    { type: String }, // e.g. 'B&H', 'Sweetwater', 'Amazon'
}, { _id: false });

const affiliateLinkSchema = new Schema({
  retailer: { type: String, required: true },
  url:      { type: String, required: true },
  label:    { type: String },
}, { _id: false });

// ─── Main GearItem Schema ─────────────────────────────────────────────────────
const gearItemSchema = new Schema(
  {
    // ── Identity & SEO ─────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Gear name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      maxlength: [100],
    },
    model: {
      type: String,
      trim: true,
      maxlength: [100],
    },
    tagline: {
      type: String,
      maxlength: [300],
      comment: 'Short marketing or editorial headline',
    },

    // ── Classification ────────────────────────────────────────────────────────
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'studio_monitor',
          'audio_interface',
          'mixing_console',
          'headphones',
          'dac_amp',
          'microphone',
          'preamp',
          'equalizer',
          'compressor',
          'effects_processor',
          'recorder',
          'cable_accessory',
          'studio_furniture',
          'other',
        ],
        message: 'Invalid category: {VALUE}',
      },
    },
    tags: [{ type: String, trim: true, maxlength: 50 }],

    // ── Media ─────────────────────────────────────────────────────────────────
    media: [mediaAssetSchema],

    // Video review (embedded YouTube/Vimeo or Cloudinary video)
    videoReview: {
      cloudinaryUrl: { type: String },
      cloudinaryPublicId: { type: String },
      youtubeId: { type: String },
      vimeoId:   { type: String },
      duration:  { type: Number }, // in seconds
      thumbnail: { type: String },
    },

    // ── Review Content ────────────────────────────────────────────────────────
    review: {
      excerpt:    { type: String, maxlength: [500, 'Excerpt max 500 chars'] },
      body:       { type: String }, // Rich text / MDX content
      scores:     { type: reviewScoreSchema },
      prosCons:   { type: prosConsSchema },
      verdict:    { type: String, maxlength: [1000] },
      isPublished:{ type: Boolean, default: false },
      publishedAt:{ type: Date },
      author:     { type: Schema.Types.ObjectId, ref: 'User' },
    },

    // ── POLYMORPHIC SPECS FIELD ───────────────────────────────────────────────
    //  `specs` is Schema.Types.Mixed to allow category-specific keys.
    //  The `specsVersion` field allows data migrations when spec schemas evolve.
    //
    //  Example for 'studio_monitor':
    //  specs: {
    //    type: '2-way active',
    //    lf_driver: '8" woofer',
    //    hf_driver: '1" tweeter',
    //    frequency_response: '52Hz–35kHz',
    //    max_spl: 108,
    //    amplifier_class: 'D',
    //    lf_power_watts: 75,
    //    hf_power_watts: 35,
    //    crossover_hz: 1800,
    //    inputs: ['XLR', 'TRS', 'RCA'],
    //    dimensions_mm: { W: 247, H: 390, D: 296 },
    //    weight_kg: 10.6,
    //  }
    //
    //  Example for 'audio_interface':
    //  specs: {
    //    inputs_mic: 2,
    //    inputs_line: 2,
    //    outputs: 4,
    //    preamp_type: 'Class-A XMAX',
    //    phantom_power: true,
    //    bit_depth: 24,
    //    sample_rates: [44100, 48000, 88200, 96000, 192000],
    //    dynamic_range_db: 115,
    //    thd_n_db: -110,
    //    usb_standard: 'USB-C 3.0',
    //    loopback: true,
    //    dsp: ['EQ', 'Compression'],
    //  }
    specs: {
      type: Schema.Types.Mixed,
      default: {},
    },
    specsVersion: {
      type: String,
      default: '1.0',
    },

    // ── Pricing ───────────────────────────────────────────────────────────────
    currentPrice: {
      amount:   { type: Number },
      currency: { type: String, default: 'USD', maxlength: 3 },
    },
    msrp: {
      amount:   { type: Number },
      currency: { type: String, default: 'USD' },
    },
    priceHistory:   [priceHistorySchema],
    affiliateLinks: [affiliateLinkSchema],
    releaseYear:    { type: Number },
    isDiscontinued: { type: Boolean, default: false },

    // ── Engagement ────────────────────────────────────────────────────────────
    stats: {
      views:     { type: Number, default: 0 },
      likes:     { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      shares:    { type: Number, default: 0 },
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['draft', 'review', 'published', 'archived'],
      default: 'draft',
    },
    isFeatured:    { type: Boolean, default: false },
    isEditorsPick: { type: Boolean, default: false },

    // ── Relationships ─────────────────────────────────────────────────────────
    relatedGear:     [{ type: Schema.Types.ObjectId, ref: 'GearItem' }],
    compatibleAudio: [{ type: Schema.Types.ObjectId, ref: 'AudioTrack' }],
    createdBy:       { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
gearItemSchema.index({ slug: 1 }, { unique: true });
gearItemSchema.index({ category: 1, status: 1 });
gearItemSchema.index({ brand: 1 });
gearItemSchema.index({ status: 1, isFeatured: -1 });
gearItemSchema.index({ 'review.scores.overall': -1 });
gearItemSchema.index({ 'currentPrice.amount': 1 });
gearItemSchema.index({ createdAt: -1 });
gearItemSchema.index({ tags: 1 });

// Full-text search index
gearItemSchema.index(
  { name: 'text', brand: 'text', 'review.excerpt': 'text', tags: 'text' },
  { weights: { name: 10, brand: 5, 'review.excerpt': 3, tags: 2 }, name: 'gear_text_search' }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
gearItemSchema.virtual('primaryImage').get(function () {
  if (!this.media || this.media.length === 0) return null;
  return this.media.find((m) => m.isPrimary && m.type === 'image') || this.media[0];
});

gearItemSchema.virtual('avgScore').get(function () {
  const s = this.review?.scores;
  if (!s) return null;
  const scores = [s.build, s.sound, s.features, s.valueForMoney, s.innovation].filter(Boolean);
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
});

gearItemSchema.virtual('hasVideoReview').get(function () {
  return !!(
    this.videoReview?.cloudinaryUrl ||
    this.videoReview?.youtubeId ||
    this.videoReview?.vimeoId
  );
});

// ─── Pre-save Middleware ──────────────────────────────────────────────────────
gearItemSchema.pre('save', async function (next) {
  // Auto-generate slug from brand + name if not set
  if (this.isNew && !this.slug) {
    const { default: slugify } = await import('slugify');
    const base = `${this.brand}-${this.name}`.toLowerCase();
    this.slug = slugify(base, { strict: true });
  }

  // Auto-set publishedAt when status changes to published
  if (this.isModified('review.isPublished') && this.review?.isPublished && !this.review?.publishedAt) {
    this.review.publishedAt = new Date();
    this.status = 'published';
  }

  next();
});

// ─── Static Methods ───────────────────────────────────────────────────────────
gearItemSchema.statics.findPublished = function (filter = {}) {
  return this.find({ ...filter, status: 'published' });
};

gearItemSchema.statics.incrementViews = function (id) {
  return this.updateOne({ _id: id }, { $inc: { 'stats.views': 1 } });
};

// ─── Query Helpers ────────────────────────────────────────────────────────────
gearItemSchema.query.published = function () {
  return this.where({ status: 'published' });
};

gearItemSchema.query.byCategory = function (category) {
  return this.where({ category });
};

const GearItem = model('GearItem', gearItemSchema);

export default GearItem;
