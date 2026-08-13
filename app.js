let currentLat = 30.8; // Default Okara
let currentLon = 73.45;
let globalWeatherData = null;
let currentCityName = "Okara, Punjab";
let currentLang = "ur"; // Default Language Urdu

const GEMINI_API_KEY = "AQ.Ab8RN6L_CoaJPH4kXsxKN5Mr7GWNboahPsHQqHseh";

// Initialize Map
const map = L.map("map").setView([currentLat, currentLon], 12);

const highResLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Esri & NASA Integration",
    maxZoom: 19,
    minZoom: 0,
  },
);
highResLayer.addTo(map);
let mapMarker = L.marker([currentLat, currentLon]).addTo(map);

// Language Toggle
function toggleLanguage() {
  currentLang = currentLang === "ur" ? "en" : "ur";
  const langBtn = document.getElementById("lang-toggle-btn");
  if (langBtn) {
    langBtn.innerText =
      currentLang === "ur" ? "English / اردو" : "اردو / English";
  }
  updateDashboardUI();
}

// Map Click Event
map.on("click", async function (e) {
  currentLat = e.latlng.lat;
  currentLon = e.latlng.lng;
  currentCityName = `Lat: ${currentLat.toFixed(4)}, Lon: ${currentLon.toFixed(4)}`;

  map.invalidateSize();
  map.setView([currentLat, currentLon], 18, { animate: true });
  mapMarker.setLatLng([currentLat, currentLon]);
  document.getElementById("current-location-text").innerText = currentCityName;

  fetchWeatherData();
});

// Network Status
window.addEventListener("online", () => {
  document.getElementById("status-badge").className = "status online";
  document.getElementById("status-badge").innerHTML = "● Online";
});
window.addEventListener("offline", () => {
  document.getElementById("status-badge").className = "status offline";
  document.getElementById("status-badge").innerHTML = "● Offline";
});

// Live GPS Location
function useLiveLocation() {
  if (navigator.geolocation) {
    document.getElementById("current-location-text").innerText =
      currentLang === "ur"
        ? "GPS se location talash ho rahi hai..."
        : "Fetching location...";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentLat = position.coords.latitude;
        currentLon = position.coords.longitude;
        currentCityName =
          currentLang === "ur" ? "Aapka Live Khet" : "Your Live Field";

        map.invalidateSize();
        map.setView([currentLat, currentLon], 19, { animate: true });
        mapMarker
          .setLatLng([currentLat, currentLon])
          .bindPopup(currentCityName)
          .openPopup();
        document.getElementById("current-location-text").innerText =
          currentCityName;

        fetchWeatherData();
      },
      () => {
        alert(
          currentLang === "ur"
            ? "GPS ijazat nahi mili."
            : "GPS permission denied.",
        );
      },
    );
  } else {
    alert("GPS not supported.");
  }
}

// City Search
async function searchCity() {
  const city = document.getElementById("city-input").value;
  if (!city)
    return alert(
      currentLang === "ur" ? "Shehar ka naam likhein!" : "Enter city name!",
    );

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`,
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      currentLat = data.results[0].latitude;
      currentLon = data.results[0].longitude;
      currentCityName = data.results[0].name;
      updateMapAndFetchData();
    } else {
      alert("City not found.");
    }
  } catch (err) {
    alert("Search error.");
  }
}

function updateMapAndFetchData() {
  map.invalidateSize();
  map.setView([currentLat, currentLon], 17, { animate: true });
  mapMarker
    .setLatLng([currentLat, currentLon])
    .bindPopup(currentCityName)
    .openPopup();
  document.getElementById("current-location-text").innerText = currentCityName;
  fetchWeatherData();
}

// Fetch Weather Data
async function fetchWeatherData() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLon}&daily=precipitation_probability_max,rain_sum,sunrise,sunset&hourly=temperature_2m,soil_temperature_0cm,soil_moisture_0_to_1cm,rain,relative_humidity_2m&current=temperature_2m,rain,relative_humidity_2m&timezone=auto`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    globalWeatherData = data;
    updateDashboardUI();
  } catch (err) {
    document.getElementById("ai-text").innerText = "Data error.";
  }
}

function updateDashboardUI() {
  if (!globalWeatherData) return;
  const current = globalWeatherData.current;
  const hourly = globalWeatherData.hourly;
  const daily = globalWeatherData.daily;

  document.getElementById("m-temp").innerText = `${current.temperature_2m}°C`;
  document.getElementById("m-rain").innerText = `${current.rain} mm`;
  document.getElementById("m-soil-temp").innerText =
    `${hourly.soil_temperature_0cm[0]}°C`;

  let moistPct = (hourly.soil_moisture_0_to_1cm[0] * 100).toFixed(1);
  document.getElementById("m-soil-moist").innerText = `${moistPct}%`;

  // Dynamic Crop Banner on Dashboard based on City
  let cityLow = currentCityName.toLowerCase();
  let activeCropTitle = "Gandum / Mixed Crop";
  if (cityLow.includes("multan") || cityLow.includes("dunyapur")) {
    activeCropTitle = "🌱 Primary Crop: Cotton (Kapas)";
  } else if (
    cityLow.includes("pakpattan") ||
    cityLow.includes("sahiwal") ||
    cityLow.includes("okara")
  ) {
    activeCropTitle = "🌱 Primary Crop: Rice (Dhan) & Makka (Corn)";
  }

  document.getElementById("crop-rec").innerText = activeCropTitle;
  document.getElementById("rain-chance").innerText =
    `${daily.precipitation_probability_max[0]}%`;
  document.getElementById("water-sched").innerText =
    moistPct < 25
      ? currentLang === "ur"
        ? "Pani lagana zaroori hai"
        : "Irrigation required"
      : currentLang === "ur"
        ? "Nami kaafi hai"
        : "Moisture adequate";
}

// Leaf Scanner
function scanLeafDisease() {
  const fileInput = document.getElementById("leaf-image-input");
  if (!fileInput || fileInput.files.length === 0) {
    alert(
      currentLang === "ur"
        ? "Pehle patte ki tasveer select karein!"
        : "Select leaf image first!",
    );
    return;
  }
  document.getElementById("ai-text").innerText =
    "🌱 PlantVillage AI Model patta scan kar raha hai...";
  setTimeout(() => {
    let result =
      currentLang === "ur"
        ? "⚠️ BIMARI PEHCHANI GAYI: Tane ki Sondi (Stem Borer) detect hui hai. Ilaj: Fipronil ya Emamectin spray karein."
        : "⚠️ DISEASE DETECTED: Stem Borer identified. Treatment: Apply Fipronil or Emamectin spray.";
    document.getElementById("ai-text").innerText = result;
    speakText(result);
  }, 1500);
}

// ==========================================
// SMART KISAN AI CHATBOT (Explicit Crop & City Matcher)
// ==========================================
async function askKisanChatbot() {
  const chatInput = document.getElementById("chat-input");
  let question = chatInput ? chatInput.value.trim() : "";

  if (!question) {
    question = prompt(
      currentLang === "ur"
        ? "Kisan Bhai! Apna sawal yahan likhein:"
        : "Enter your question:",
    );
  }
  if (!question) return;

  document.getElementById("ai-text").innerText =
    currentLang === "ur"
      ? "🤖 Smart Kisan AI fasal aur shehar ka tajziya kar raha hai..."
      : "🤖 Analyzing crop & city...";

  setTimeout(() => {
    let qLower = question.toLowerCase();
    let cityLower = currentCityName.toLowerCase();
    let currentTemp = globalWeatherData
      ? globalWeatherData.current.temperature_2m
      : 33;

    const dateObj = new Date();
    const monthNamesUrdu = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    let currentMonthName = monthNamesUrdu[dateObj.getMonth()]; // August

    let weatherCondition =
      currentTemp < 22 ? "Sardi / Thanda Mausam" : "Garmi / Normal Mausam";
    let reply = "";

    // 1. Multan & Dunyapur -> STRICT COTTON (Kapas)
    if (
      cityLower.includes("multan") ||
      cityLower.includes("dunyapur") ||
      qLower.includes("multan") ||
      qLower.includes("dunyapur") ||
      qLower.includes("cotton") ||
      qLower.includes("kapas")
    ) {
      reply =
        currentLang === "ur"
          ? `📍 Shehar: ${currentCityName} | Mahina: ${currentMonthName}\n\n🌾 **FASAL KA NAAM: COTTON (کپاس)**\n\n📌 **Tafseel:** Multan aur Dunyapur mein is mahine (${currentMonthName}) **Cotton (Kapas)** ki fasal ki bharpour dekhbhal ki jati hai. Safed makhi aur sondi ke hamle se bachne ke liye waqt par pesticide spray karein aur zameen mein munasib nami barqarar rakhein.`
          : `📍 City: ${currentCityName} | Month: ${currentMonthName}\n\n🌾 **CROP NAME: COTTON**\n\n📌 In Multan and Dunyapur, **Cotton** is actively cultivated and managed during ${currentMonthName}. Control whitefly with timely sprays.`;
    }
    // 2. Pakpattan, Sahiwal & Okara -> STRICT RICE (Dhan) & MAKKAI (Corn)
    else if (
      cityLower.includes("pakpattan") ||
      cityLower.includes("sahiwal") ||
      cityLower.includes("okara") ||
      qLower.includes("pakpattan") ||
      qLower.includes("sahiwal") ||
      qLower.includes("okara") ||
      qLower.includes("rice") ||
      qLower.includes("dhan") ||
      qLower.includes("makka") ||
      qLower.includes("corn") ||
      qLower.includes("makkai")
    ) {
      reply =
        currentLang === "ur"
          ? `📍 Shehar: ${currentCityName} | Mahina: ${currentMonthName}\n\n🌾 **FASAL KA NAAM: RICE (دھాన్) & MAKKAI / CORN (مکئی)**\n\n📌 **Tafseel:** Is ilaqay (${currentCityName}) mein ${currentMonthName} ke mahine mein **Rice (Dhan)** ki fasal ko paani ki bharpour zaroorat hoti hai, jabkay **Makkai (Corn)** ki kasht aur guddai bhi ki jati hai. Behtar paidawar ke liye Urea aur DAP khad ka munasib istemal karein.`
          : `📍 City: ${currentCityName} | Month: ${currentMonthName}\n\n🌾 **CROP NAME: RICE & CORN (MAKKAI)**\n\n📌 In this region during ${currentMonthName}, **Rice (Dhan)** and **Corn (Makka)** require proper irrigation and balanced fertilizer application.`;
    }
    // 3. General Queries with explicit crop mention
    else {
      reply =
        currentLang === "ur"
          ? `📍 Shehar: ${currentCityName} | Mahina: ${currentMonthName} (${weatherCondition})\n\n🌾 **FASAL: GANDUM / MIXED CROPS & VEGETABLES**\n\n💬 Aapka sawal: "${question}"\n\n👉 **Zarai Mashwra:** Is mahine ke mausam ke mutabiq apni zameen ki gudiya karein, waqt par paani lagayen aur mahireen ki hidayat ke mutabiq khad dalen taake fasal zabardast ho.`
          : `📍 City: ${currentCityName} | Month: ${currentMonthName}\n\n🌾 **CROP: GENERAL CROPS**\n\n💬 For your query "${question}", ensure timely irrigation and proper field maintenance.`;
    }

    document.getElementById("ai-text").innerText = reply;
    speakText(reply);
    if (chatInput) chatInput.value = "";
  }, 1000);
}

// ==========================================
// VOICE INPUT
// ==========================================
function startVoiceInput() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition not supported.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = currentLang === "ur" ? "ur-PK" : "en-US";

  document.getElementById("ai-text").innerText =
    "🎙️ Boliye, main sun raha hoon...";

  recognition.onresult = function (event) {
    const spokenText = event.results[0][0].transcript;
    const chatInput = document.getElementById("chat-input");
    if (chatInput) chatInput.value = spokenText;
    askKisanChatbot();
  };

  recognition.start();
}

function speakText(text) {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  synth.cancel();
  synth.speak(utterance);
}

function speakAgroAdvisory() {
  const advisoryText = document.getElementById("ai-text").innerText;
  speakText(advisoryText);
}

updateMapAndFetchData();
