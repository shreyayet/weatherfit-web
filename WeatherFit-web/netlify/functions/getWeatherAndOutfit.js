// netlify/functions/getWeatherAndOutfit.js
import fetch from 'node-fetch';

export async function handler(event, context) {
  try {
    const { city } = JSON.parse(event.body);

    if (!city) {
      return { statusCode: 400, body: 'City is required' };
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // 1️⃣ Fetch weather data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    const weatherData = await weatherResponse.json();

    if (weatherData.cod !== 200) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid city or weather data not found' }),
      };
    }

    const temperature = weatherData.main.temp;
    const description = weatherData.weather[0].description;

    // 2️⃣ Generate outfit suggestion (simplified for now)
    const prompt = `The current temperature in ${city} is ${temperature}°C with ${description}. 
    Suggest an appropriate outfit for this weather.`;

    const llmResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const llmData = await llmResponse.json();
    const outfit = llmData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestion available.';

    return {
      statusCode: 200,
      body: JSON.stringify({
        city,
        temperature,
        description,
        outfit,
      }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}