import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import PersistentAudioPlayer from '../audio/PersistentAudioPlayer';

export default function MainLayout() {
  return (
    <>
      <Navbar /> {/* <-- Aquí inyectamos tu nueva barra de navegación */}
      <div className="page-container">
        <main className="main-content">
          <Outlet /> {/* Aquí se inyectan tus páginas */}
        </main>
        <PersistentAudioPlayer />
      </div>
    </>
  );
}
