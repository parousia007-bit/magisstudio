import { Link } from 'react-router-dom';
import './GearCard.css';

const CATEGORY_LABELS = {
  studio_monitor:    'Monitor',
  audio_interface:   'Interface',
  mixing_console:    'Consola',
  headphones:        'Auriculares',
  dac_amp:           'DAC/AMP',
  microphone:        'Micrófono',
  preamp:            'Preamp',
  equalizer:         'EQ',
  compressor:        'Compresor',
  effects_processor: 'FX',
  recorder:          'Grabadora',
  cable_accessory:   'Accesorio',
  other:             'Gear',
};

export default function GearCard({ gear }) {
  const {
    name, slug, brand, category,
    media, review, currentPrice, isFeatured, isEditorsPick,
  } = gear;

  const image = media?.find((m) => m.isPrimary) || media?.[0];
  const score = review?.scores?.overall;

  return (
    <Link to={`/gear/${slug}`} className="gear-card glass" aria-label={`${brand} ${name}`}>
      <div className="gear-card__image-wrap">
        {image ? (
          <img
            src={image.url}
            alt={image.alt || `${brand} ${name}`}
            className="gear-card__image"
            loading="lazy"
          />
        ) : (
          <div className="gear-card__image-placeholder" aria-hidden="true">
            <span>⚡</span>
          </div>
        )}

        <div className="gear-card__badges" aria-label="Badges">
          {isEditorsPick && (
            <span className="badge badge-amber gear-card__badge">Editor's Pick</span>
          )}
          {isFeatured && !isEditorsPick && (
            <span className="badge badge-cyan gear-card__badge">Featured</span>
          )}
        </div>

        {score != null && (
          <div className={`gear-card__score ${score >= 9 ? 'is-gold' : score >= 7 ? 'is-good' : ''}`}>
            <span className="gear-card__score-value">{score.toFixed(1)}</span>
            <span className="gear-card__score-label">/10</span>
          </div>
        )}
      </div>

      <div className="gear-card__body">
        <div className="gear-card__category">
          <span>{brand}</span>
          <span className="gear-card__dot" aria-hidden="true">·</span>
          <span>{CATEGORY_LABELS[category] || category}</span>
        </div>

        <h3 className="gear-card__name">{name}</h3>

        {review?.excerpt && (
          <p className="gear-card__excerpt">{review.excerpt}</p>
        )}

        <div className="gear-card__footer">
          {currentPrice?.amount && (
            <span className="gear-card__price">
              <span className="gear-card__price-currency">{currentPrice.currency || 'USD'} </span>
              {currentPrice.amount.toLocaleString()}
            </span>
          )}
          <span className="gear-card__cta" aria-hidden="true">Ver reseña →</span>
        </div>
      </div>

      <div className="gear-card__glow" aria-hidden="true" />
    </Link>
  );
}
