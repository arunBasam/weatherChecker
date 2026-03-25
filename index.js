require("dotenv").config();
const axios = require("axios");
const fs = require("fs");

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// Read orders
const orders = JSON.parse(fs.readFileSync("orders.json", "utf-8"));

// Weather conditions causing delay
const DELAY_WEATHER = ["Rain", "Snow", "Extreme", "Clouds"];

// AI-style apology function
function generateApology(customer, city, weather) {
  return `Hi ${customer}, your order to ${city} is delayed due to ${weather.toLowerCase()}. We appreciate your patience!`;
}

// Fetch weather for one order
async function fetchWeather(order) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        q: order.city,
        appid: API_KEY
      }
    });

    const weatherMain = response.data.weather[0].main;

    if (DELAY_WEATHER.includes(weatherMain)) {
      order.status = "Delayed";
      order.message = generateApology(order.customer, order.city, weatherMain);
    }

    return order;

  } catch (error) {
    console.error(`❌ Error for ${order.city}:`, error.response?.data?.message || error.message);
    return order; // important: continue execution
  }
}

// 🚀 Parallel processing
async function processOrders() {
  const updatedOrders = await Promise.all(
    orders.map(order => fetchWeather(order))
  );

  fs.writeFileSync("orders_updated.json", JSON.stringify(updatedOrders, null, 2));

  console.log("✅ Done! Check orders_updated.json");
}

processOrders();