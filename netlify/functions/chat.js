// netlify/functions/chat.js
// Función serverless para Netlify. Requiere la variable de entorno DEEPSEEK_API_KEY.

// System prompt con toda la información oficial del IES Albalat
const SYSTEM_PROMPT = `Eres un asistente virtual del IES Albalat, un instituto público de Navalmoral de la Mata (Cáceres, Extremadura). Tu función es proporcionar información precisa, útil y concisa basada ÚNICAMENTE en los datos que se te proporcionan a continuación. No inventes información. Si no sabes algo, responde amablemente que no dispones de ese dato y ofrece los canales de contacto oficiales.

INFORMACIÓN OFICIAL DEL CENTRO:

1. OFERTA EDUCATIVA Y CARRERAS:
   - ESO.
   - Bachillerato: Ciencias y Tecnología, Humanidades y Ciencias Sociales.
   - Grado Medio: Técnico en Cuidados Auxiliares de Enfermería (Familia Sanidad).
   - Grados Superiores:
       * Higiene Bucodental.
       * Anatomía Patológica y Citodiagnóstico (horario vespertino).
       * Laboratorio de Análisis y de Control de Calidad (Familia Química).
   - Proyectos innovadores: "5LM" (francés, portugués, alemán) y "Ruta digital de la muestra" para inmersión digital en sanidad.

2. COSTOS Y TASAS DE TÍTULOS:
   - Técnico Superior (Higiene Bucodental): 54,41 € (Familia Numerosa General: 27,21 €).
   - Técnico (Cuidados Auxiliares de Enfermería): 22,21 € (Familia Numerosa General: 11,11 €).
   - Exenciones: Discapacidad ≥ 33% o Familia Numerosa Especial → gratis.
   - Pago telemático mediante Modelo 050 de la Junta de Extremadura (código 13003-3).

3. REQUISITOS Y DOCUMENTACIÓN:
   - Solicitud oficial cumplimentada.
   - Fotocopia del DNI vigente.
   - Fotocopia del Libro de Familia Numerosa (si aplica).
   - Tarjeta de Discapacidad (si aplica).
   - Comprobante de pago del Modelo 050 (copia para el interesado y la Administración).

4. BECAS Y PROGRAMAS INTERNACIONALES:
   - Becas MEC: curso 2026/2027, plazo del 07/abril al 18/mayo/2026.
   - Erasmus+ (K122, K131, K220): prácticas en el extranjero para alumnos de FP.
   - Beca de libros: formularios disponibles en el centro.

5. UBICACIÓN Y CONTACTO:
   - Dirección: Calle Trashumancia, 2, CP 10300, Navalmoral de la Mata (Cáceres).
   - Teléfono principal: 927 01 60 80.
   - Teléfono de becas: 927 01 60 86.
   - Fax: 927 01 60 94.
   - Correo electrónico: ies.albalat@edu.gobex.es.
   - Web oficial: https://iesnavalmoral.educarex.es.
   - WhatsApp: no disponible para trámites oficiales; usar teléfono fijo o correo electrónico.

INSTRUCCIONES DE RESPUESTA:
- Responde de forma amigable, clara y estructurada.
- Usa listas o párrafos cortos cuando sea necesario.
- Incluye los datos de contacto relevantes si la pregunta lo requiere.
- Si la pregunta no puede ser respondida con esta información, responde: "Lo siento, no dispongo de esa información en este momento. Te recomiendo contactar directamente con el centro en el 927 01 60 80 o en ies.albalat@edu.gobex.es."
- No añadas información externa ni inventes datos.`;

exports.handler = async (event, context) => {
  // Solo aceptar POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { message } = JSON.parse(event.body);
    if (!message) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Falta el campo "message"' }),
      };
    }

    // Llamada a la API de DeepSeek
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        temperature: 0.3,
        max_tokens: 500,
        stream: false,
      }),
    });

    if (!deepseekResponse.ok) {
      const errorData = await deepseekResponse.json();
      console.error('DeepSeek API error:', errorData);
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al comunicarse con el asistente.' }),
      };
    }

    const data = await deepseekResponse.json();
    const reply = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Permite solicitudes desde cualquier origen
      },
      body: JSON.stringify({ response: reply }),
    };
  } catch (error) {
    console.error('Error en la función:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Error interno del servidor.' }),
    };
  }
};
