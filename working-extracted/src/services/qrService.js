import QRCode from 'qrcode';
import { config } from '../config/config.js';

/**
 * Genera un QR code único para un distribuidor
 * @param {Object} distribuidor - Objeto del distribuidor
 * @returns {Promise<string>} - Data URL del QR code (base64)
 */
export const generateQRForDistribuidor = async (distribuidor) => {
  try {
    // Construir la URL con el ID o representante del distribuidor
    // MongoDB usa _id, así que usamos _id.toString() o el representante como slug
    const distribuidorId = distribuidor._id ? distribuidor._id.toString() : distribuidor.id;
    const slug = distribuidorId || (distribuidor.representante ? distribuidor.representante.toLowerCase().replace(/\s+/g, '-') : distribuidorId);
    const url = `${config.baseUrl}/api/distribuidores/${slug}/info`;
    
    // Generar el QR code
    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1
    });

    return {
      qrCode: qrDataUrl,
      url: url,
      distribuidorId: distribuidorId,
      distribuidorRepresentante: distribuidor.representante
    };
  } catch (error) {
    throw new Error(`Error al generar QR: ${error.message}`);
  }
};

/**
 * Genera solo la URL para el distribuidor (sin QR)
 */
export const generateURLForDistribuidor = (distribuidor) => {
  const distribuidorId = distribuidor._id ? distribuidor._id.toString() : distribuidor.id;
  const slug = distribuidorId || (distribuidor.representante ? distribuidor.representante.toLowerCase().replace(/\s+/g, '-') : distribuidorId);
  return `${config.baseUrl}/api/distribuidores/${slug}/info`;
};

