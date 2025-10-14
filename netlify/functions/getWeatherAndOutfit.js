// netlify/functions/getWeatherAndOutfit.js
//import fetch from 'node-fetch';

function ruleBasedOutfit(temp, description, windSpeed) {
  const descLower = description.toLowerCase();
  let suggestion = "";

  if (temp < 40) { // < 40°F
    suggestion = "It's cold! 🥶 Bring a coat before you head out!";
  } else if (temp >= 40 && temp < 55) { // 40–55°F
    if (descLower.includes("wind") || windSpeed > 20) { // 20 mph
      suggestion = "It’s chilly and windy! 🌬️ Try pairing jeans with a sweater. Layer up!";
    } else {
      suggestion = "It's a bit chilly! Wear a sweater with jeans or leggings. Bring layers just in case. If you want to be comfy, wear a sweat set!";
    }
  } else if (temp >= 55 && temp < 70) { // 55–70°F
    suggestion = "It's nice out! 🌤️ Bring a light jacket or wear a long sleeve shirt for when it gets cooler later.";
  } else if (temp >= 70 && temp < 80) { // 70–80°F
    suggestion = "It’s warm! 🌞 Wear a flowy dress today! Or a cute shirt and shorts.";
  } else {
    suggestion = "It’s hot! 🍳 Go for light fabrics like tank tops, dresses, or athletic wear.";
  }

  if (descLower.includes("sun") || descLower.includes("clear")) {
    suggestion += " And the sun is out today. Bring sunnies and don't forget sunscreen! 😎";
  }

  return suggestion;
}

export async function handler(event, context) {
  try {
    const { city } = JSON.parse(event.body);

    if (!city) {
      return { statusCode: 400, body: 'City is required' };
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    console.log('Gemini key loaded?', !!geminiKey);

    
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`
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
    const windSpeed = weatherData.wind.speed;

    
    const prompt = `The current temperature in ${city} is ${temperature}°F with ${description} and wind speed of ${windSpeed} mph. 
    Suggest an short, helpful outfit recommendation for someone going outside today.`;

    let outfit;
try {
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
  console.log('gemini response:', JSON.stringify(llmData, null, 2));
  
  outfit = llmData?.candidates?.[0]?.content?.parts?.[0]?.text;
} catch (err) {
  console.error("LLM call failed:", err);
}

// 🧥 Rule-based fallback
if (!outfit) {
  outfit = ruleBasedOutfit(temperature, description, windSpeed);
}

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