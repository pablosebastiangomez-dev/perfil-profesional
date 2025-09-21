// backend/server.js
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Permite que nuestro frontend le hable a este backend

// --- RUTA PARA LA API DE GEMINI ---
app.get('/gemini-scraper', async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const url = "https://es.tradingview.com/markets/stocks-usa/market-movers-large-cap/";
    const prompt = `Analiza la tabla "Ganadoras" en la URL: ${url}. Para las primeras 5 empresas, extrae únicamente el nombre y el símbolo (ticker). Devuelve la info en formato JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (!match) throw new Error("La IA no devolvió un JSON válido.");

    res.json(JSON.parse(match[0]));
  } catch (error) {
    console.error("Error en /gemini-scraper:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- RUTA PARA LA API DE TWELVE DATA ---
app.get('/stock-api', async (req, res) => {
  try {
    const API_KEY = process.env.TWELVE_DATA_API_KEY;
    const symbols = "TSLA,NVDA,AAPL,MSFT,AMZN";
    const apiUrl = `https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${API_KEY}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    const formattedData = Object.values(data).map(stock => ({
        nombre: stock.name,
        simbolo: stock.symbol,
        precio: parseFloat(stock.close),
        cambio_porcentaje: parseFloat(stock.percent_change),
        volumen: stock.volume ? (stock.volume / 1000000).toFixed(2) + 'M' : 'N/A'
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error en /stock-api:", error);
    res.status(500).json({ error: "No se pudo obtener datos de la API de Twelve Data." });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
