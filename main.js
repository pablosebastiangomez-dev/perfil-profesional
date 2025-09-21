document.addEventListener('DOMContentLoaded', () => {
    const cryptoTable = document.querySelector('#crypto-table');
    const moversFinalTable = document.querySelector('#movers-final-table');
    
    if (cryptoTable) fetchCryptoData();
    if (moversFinalTable) fetchHybridMoversData();
});

// === LÓGICA PARA DASHBOARD HÍBRIDO DE ACCIONES ===
async function fetchHybridMoversData() {
    const tableBody = document.querySelector('#movers-final-table tbody');
    
    // 👇 Pega aquí la URL de tu servicio web de Render.
    // Ej: 'https://perfil-profesional-backend.onrender.com'
    const backendUrl = 'https://perfil-profesional-backend.onrender.com'; 

    try {
        // Hacemos ambas llamadas a nuestro backend en Render
        const [aiResponse, apiResponse] = await Promise.all([
            fetch(`${backendUrl}/gemini-scraper`),
            fetch(`${backendUrl}/stock-api`)
        ]);

        if (!aiResponse.ok) throw new Error('La función de IA falló. (gemini-scraper)');
        if (!apiResponse.ok) throw new Error('La API de datos falló. (stock-api)');

        const companiesFromAI = await aiResponse.json();
        const financialsFromAPI = await apiResponse.json();

        const financialsMap = new Map(financialsFromAPI.map(stock => [stock.simbolo, stock]));

        const mergedData = companiesFromAI.map(company => {
            const financials = financialsMap.get(company.simbolo) || {};
            return { ...company, ...financials };
        });

        displayHybridMovers(mergedData);

    } catch (error) {
        console.error("Error al obtener datos híbridos:", error);
        tableBody.innerHTML = `<tr><td colspan="5" class="error">${error.message}</td></tr>`;
    }
}

function displayHybridMovers(data) {
    const tableBody = document.querySelector('#movers-final-table tbody');
    tableBody.innerHTML = '';
    
    data.forEach(stock => {
        const price = stock.precio ?? 0;
        const change = stock.cambio_porcentaje ?? 0;
        const changeColorClass = change >= 0 ? 'color-green' : 'color-red';

        const row = `
            <tr>
                <td>${stock.simbolo}</td>
                <td class="stock-name">${stock.nombre}</td>
                <td>${formatCurrency(price)}</td>
                <td class="${changeColorClass}">${change.toFixed(2)}%</td>
                <td>${stock.volumen || 'N/A'}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}


// === LÓGICA PARA DASHBOARD DE CRIPTOMONEDAS ===
async function fetchCryptoData() {
    const cryptoTableBody = document.querySelector('#crypto-table tbody');
    const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Error en la respuesta: ${response.statusText}`);
        const coins = await response.json();
        cryptoTableBody.innerHTML = ''; 
        coins.forEach((coin, index) => {
            const priceChange = coin.price_change_percentage_24h;
            const changeColorClass = priceChange >= 0 ? 'color-green' : 'color-red';
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td class="coin-name">
                        <img src="${coin.image}" alt="${coin.name} logo">
                        <span>${coin.name} <span class="symbol">${coin.symbol.toUpperCase()}</span></span>
                    </td>
                    <td>${formatCurrency(coin.current_price)}</td>
                    <td class="${changeColorClass}">${priceChange.toFixed(2)}%</td>
                    <td>${formatMarketCap(coin.market_cap)}</td>
                </tr>
            `;
            cryptoTableBody.innerHTML += row;
        });
    } catch (error) {
        cryptoTableBody.innerHTML = `<tr><td colspan="5" class="error">No se pudieron cargar los datos.</td></tr>`;
    }
}

// === FUNCIONES AUXILIARES ===
const formatCurrency = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
const formatMarketCap = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(num);
