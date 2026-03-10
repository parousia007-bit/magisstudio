import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// Cargar las variables del archivo .env
dotenv.config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// La ruta exacta de tu captura
const folderPath = '/home/andres/Descargas/mis cancions/subir a cloudinary/';
const files = [
  'Falsa Simetría (Simulacro)(1).mp3',
  'Frecuencia Ámbar.mp3',
  'Órbita Secreta (Gravedad).mp3'
];

async function uploadFiles() {
  console.log('🚀 Iniciando subida a Cloudinary...');
  
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    try {
      console.log(`\nSubiendo: ${file}...`);
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video', // En Cloudinary, el audio puro se sube como 'video'
        folder: 'magis_studio/laboratorio_sonoro'
      });
      console.log(`✅ ¡Éxito! URL de ${file}:`);
      console.log(result.secure_url);
    } catch (error) {
      console.error(`❌ Error al subir ${file}:`, error.message);
    }
  }
  console.log('\n🎉 Proceso de subida terminado.');
}

uploadFiles();
