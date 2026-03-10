import GearCard from '../components/gear/GearCard';

const DEMO_GEAR_CATALOG = [
  { _id: '1', slug: 'yamaha-hs8', brand: 'Yamaha', name: 'HS8 Studio Monitor', category: 'studio_monitor', review: { scores: { overall: 9.2 }, excerpt: 'El estándar de referencia para mezcla.' }, currentPrice: { amount: 799, currency: 'USD' }, isFeatured: true, isEditorsPick: true },
  { _id: '2', slug: 'focusrite-4i4', brand: 'Focusrite', name: 'Scarlett 4i4 Gen 4', category: 'audio_interface', review: { scores: { overall: 8.8 }, excerpt: 'Preamps Air mejorados.' }, currentPrice: { amount: 249, currency: 'USD' }, isFeatured: true },
  { _id: '3', slug: 'sennheiser-hd600', brand: 'Sennheiser', name: 'HD 600', category: 'headphones', review: { scores: { overall: 9.5 }, excerpt: 'La referencia absoluta en auriculares abiertos.' }, currentPrice: { amount: 399, currency: 'USD' }, isEditorsPick: true },
  { _id: '4', slug: 'shure-sm7b', brand: 'Shure', name: 'SM7B', category: 'microphone', review: { scores: { overall: 8.5 }, excerpt: 'El estándar para podcasting y voces de radio.' }, currentPrice: { amount: 399, currency: 'USD' } },
];

export default function GearVaultPage() {
  return (
    <div className="animate-fade-up glass p-8 mt-12" style={{ borderRadius: 'var(--radius-lg)' }}>
      <h1 className="text-amber" style={{ marginBottom: '20px' }}>Catálogo: Gear Vault</h1>
      <p className="text-muted" style={{ marginBottom: '40px' }}>Explora nuestras reseñas técnicas de equipo profesional.</p>
      
      {/* Aquí inyectamos el CSS "gear-grid" de tu HomePage para que las tarjetas se alineen bonito */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {DEMO_GEAR_CATALOG.map(gear => (
          <GearCard key={gear._id} gear={gear} />
        ))}
      </div>
    </div>
  );
}
