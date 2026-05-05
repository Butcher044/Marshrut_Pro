import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Load Yandex Maps JS API v3 if key is provided (free key: developer.tech.yandex.ru)
const ymapsKey = import.meta.env.VITE_YANDEX_MAPS_KEY
if (ymapsKey) {
  const s = document.createElement('script')
  s.src = `https://api-maps.yandex.ru/v3/?apikey=${ymapsKey}&lang=ru_RU`
  document.head.appendChild(s)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
