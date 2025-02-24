// Constants
const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";
const ONE_DAY_MS = 86400000;
const MAGNITUDE_SCALE = 50000;

// Map and Data
let map;
let earthquakes = [];
let quakeLayerGroup; // Feature group for earthquake markers
let currentTime;
let playbackSpeed = 1000;
let playing = false;
let loop = false;
let interval;

// Initialize Leaflet Map
function initMap() {
    map = L.map('map').setView([37.0902, -95.7129], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    quakeLayerGroup = L.featureGroup().addTo(map); // Initialize the feature group
    fetchEarthquakeData();
}

// Fetch and Process Earthquake Data
async function fetchEarthquakeData() { // Use async/await for cleaner code
    try {
        const response = await fetch(USGS_URL);
        const data = await response.json();

        earthquakes = data.features.map(quake => {
            const coords = quake.geometry.coordinates;
            return {
                lat: coords[1],
                lng: coords[0],
                mag: quake.properties.mag,
                time: quake.properties.time,
                place: quake.properties.place //add place for popup
            };
        });

        const earliestTime = Math.min(...earthquakes.map(q => q.time));
        const latestTime = Date.now();

        currentTime = earliestTime;

        document.getElementById("startDateLabel").textContent = formatDate(earliestTime);
        document.getElementById("endDateLabel").textContent = formatDate(latestTime);

        updateMap();
        updateDateDisplay();
    } catch (error) {
        console.error("Error fetching earthquake data:", error);
        alert("Failed to load earthquake data. Please try again later."); // User-friendly error
    }
}

// Update the Map
function updateMap() {
    quakeLayerGroup.clearLayers(); // Clear existing markers

    earthquakes.forEach(quake => {
        if (quake.time <= currentTime) {
            const age = currentTime - quake.time;
            const color = getColorByAge(age);

            const circle = L.circle([quake.lat, quake.lng], {
                color,
                fillColor: color,
                fillOpacity: 0.6,
                radius: quake.mag * MAGNITUDE_SCALE
            });
            circle.bindPopup(`Magnitude: ${quake.mag}<br>Place: ${quake.place}<br>Time: ${new Date(quake.time).toLocaleString()}`);
            circle.addTo(quakeLayerGroup);
        }
    });
}

// Determine Color Based on Earthquake Age
function getColorByAge(age) {
    if (age < 3600000) return "red";
    if (age < 86400000) return "orange";
    if (age < 604800000) return "yellow";
    if (age < 2592000000) return "white";
    return null;
}

// Format Timestamp into Readable Date
function formatDate(timestamp) {
    return new Date(timestamp).toISOString().split("T")[0];
}

// Update the Date Display
function updateDateDisplay() {
    document.getElementById("currentDate").textContent = formatDate(currentTime);
}

// Playback Control
document.getElementById("play").addEventListener("click", () => {
    if (playing) {
        clearInterval(interval);
        playing = false;
    } else {
        interval = setInterval(() => {
            currentTime += ONE_DAY_MS;

            if (currentTime > Date.now()) {
                if (loop) {
                    currentTime = Math.min(...earthquakes.map(q => q.time));
                } else {
                    clearInterval(interval);
                    playing = false;
                }
            }

            updateMap();
            updateDateDisplay();
        }, playbackSpeed);
        playing = true;
    }
});

// Speed Control
document.getElementById("speed").addEventListener("input", (e) => {
    playbackSpeed = 2000 - e.target.value;
    const speedLabel = playbackSpeed < 750 ? "Fast" : playbackSpeed > 1250 ? "Slow" : "Normal";
    document.getElementById("speedLabel").textContent = speedLabel;
});

// Loop Toggle
document.getElementById("loop").addEventListener("change", (e) => {
    loop = e.target.checked;
});

// Time Range Control
document.getElementById("timeRange").addEventListener("input", (e) => {
    const rangeDays = parseInt(e.target.value);
    const latestTime = Date.now();
    currentTime = latestTime - (rangeDays * ONE_DAY_MS);
    document.getElementById("startDateLabel").textContent = formatDate(currentTime);
    updateMap();
    updateDateDisplay();
    if(!playing){
        clearInterval(interval);
    }
});

window.onload = initMap;
