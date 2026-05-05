// netlify/functions/chat.js
// Función serverless para Netlify usando OpenRouter con el modelo gratuito NVIDIA Nemotron.
// Requiere la variable de entorno OPENROUTER_API_KEY en Netlify.

const SYSTEM_PROMPT = `Eres el asistente virtual oficial del IES Albalat (Navalmoral de la Mata, Cáceres). Responde siempre de forma amable, clara y utilizando formato HTML básico (como <strong> para resaltar, <ul> y <li> para listas cuando sea apropiado, y <br> para saltos de línea) para que la respuesta se vea bien en el chat. NO uses Markdown, solo HTML.

INFORMACIÓN OFICIAL DEL CENTRO (única fuente de conocimiento):

1. OFERTA EDUCATIVA Y CARRERAS:
   - ESO.
   - Bachillerato: Ciencias y Tecnología, Humanidades y Ciencias Sociales.
   - Grado Medio: Técnico en Cuidados Auxiliares de Enfermería (Familia Sanidad).
   - Grados Superiores:
       * Higiene Bucodental.
       * Anatomía Patológica y Citodiagnóstico (turno vespertino).
       * Laboratorio de Análisis y de Control de Calidad (Familia Química).
   - Proyectos innovadores: "5LM" (francés, portugués, alemán) y "Ruta digital de la muestra" (inmersión digital en sanidad).

2. COSTOS Y TASAS DE TÍTULOS:
   - Técnico Superior (Higiene Bucodental): 54,41 € (Fam. Numerosa General: 27,21 €).
   - Técnico (Cuidados Auxiliares de Enfermería): 22,21 € (Fam. Numerosa General: 11,11 €).
   - Exenciones: Discapacidad ≥33% o Familia Numerosa Especial → gratis.
   - Pago telemático mediante Modelo 050 de la Junta de Extremadura (código 13003-3).

3. REQUISITOS Y DOCUMENTACIÓN:
   - Solicitud oficial cumplimentada.
   - Fotocopia del DNI vigente.
   - Libro de Familia Numerosa (si aplica).
   - Tarjeta de Discapacidad (si aplica).
   - Comprobante de pago del Modelo 050 (copia para el interesado y la Administración).

4. BECAS Y AYUDAS:
   - Becas MEC: curso 2026/2027, solicitud del 7 de abril al 18 de mayo de 2026.
   - Ayuda de libros: formulario disponible en secretaría.
   - PAU 2026: instrucciones para alumnado de Bachillerato y Ciclos que quieran realizar la prueba de acceso a la universidad.

5. MOVILIDAD INTERNACIONAL (ERASMUS+):
   - Proyectos K122, K131, K220: prácticas en el extranjero para alumnos de FP.
   - Convocatorias publicadas en el tablón de anuncios del centro.

6. SECRETARÍA Y TRÁMITES:
   - Expedición de títulos, anulación de matrícula, listas de espera y reclamaciones de calificaciones finales.
   - Contacto: teléfono 927 01 60 80, correo ies.albalat@edu.gobex.es.

7. CALENDARIO ACADÉMICO Y ORIENTACIÓN:
   - Exámenes de pendientes: 4 al 8 de mayo de 2026 (varias materias en horario de mañana).
   - Jornada de orientación a familias: 14 de abril (opciones tras 4º ESO y 2º Bachillerato).
   - Jornadas de Puertas Abiertas para nuevos alumnos.

8. CONTACTO Y UBICACIÓN:
   - Dirección: Calle Trashumancia, 2, CP 10300, Navalmoral de la Mata (Cáceres).
   - Teléfono general: 927 01 60 80.
   - Teléfono de becas: 927 01 60 86.
   - Fax: 927 01 60 94.
   - Correo: ies.albalat@edu.gobex.es.
   - Web oficial: https://iesnavalmoral.educarex.es.
   - WhatsApp NO disponible para trámites oficiales; usar teléfono fijo o correo.

INSTRUCCIONES ESTRICTAS:
- Responde ÚNICAMENTE con la información anterior. No inventes nada.
- Si te preguntan sobre temas no cubiertos, responde: "Lo siento, no dispongo de esa información en este momento. Te recomiendo contactar directamente con el centro en el 927 01 60 80 o escribir a ies.albalat@edu.gobex.es. También puedes visitar nuestra web: https://iesnavalmoral.educarex.es."
- Mantén un tono cálido y profesional, propio de un instituto educativo.`;

// Headers CORS reutilizables en todas las respuestas
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event, context) => {
  // Responder al preflight CORS que envían los navegadores antes del POST
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  // Solo aceptar POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { message } = JSON.parse(event.body);
    if (!message) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Falta el campo "message"' }),
      };
    }

    // Llamada a la API de OpenRouter usando el modelo gratuito NVIDIA Nemotron
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': event.headers.referer || 'https://iesnavalmoral.educarex.es',
        'X-Title': 'Asistente IES Albalat',
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', // <--- Aquí el cambio
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Error al comunicarse con el asistente.' }),
      };
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ response: reply }),
    };
  } catch (error) {
    console.error('Error en la función:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Error interno del servidor.' }),
    };
  }
};
