const cityInput = document.querySelector('#city');
const goBtn = document.querySelector('#go');
const result = document.querySelector('#result');

goBtn.addEventListener('click', async () => {
  const city = cityInput.value.trim();

  if (!city) {
    alert('Please enter a city.');
    return;
  }

  result.hidden = false;
  result.textContent = 'Fetching weather & outfit suggestion...';

  try {
    const response = await fetch('/.netlify/functions/getWeatherAndOutfit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Request failed');
    }

    const data = await response.json();

    result.innerHTML = `
      <h2>${data.city}</h2>
      <p><strong>Weather:</strong> ${data.temperature}°F, ${data.description}</p>
      <p><strong>Suggested Outfit:</strong><br>${data.outfit}</p>
    `;
  } catch (error) {
    console.error('Error:', error);
    result.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
  }
});