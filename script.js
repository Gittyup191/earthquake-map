let map;
let earthquakes = [];
let currentTime;
let playbackSpeed = 1000; // 1 month = 10 sec
let playing = false;
let loop = false;
let interval;

// Initialize Leaflet Map
function initMap() {
    map = L.map('map').setView([37.0902, -95.7129], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    fetchEarthquakeData();
}

// Fetch and process earthquake data
function fetchEarthquakeData() {
    fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson")
        .then(response => response.json())
        .then(data => {
            earthquakes = data.features.map(quake => {
                const coords = quake.geometry.coordinates;
                return {
                    lat: coords[1],
                    lng: coords[0],
                    mag: quake.properties.mag,
                    time: quake.properties.time
                };
            });

            // Start at the earliest earthquake
            currentTime = Math.min(...earthquakes.map(q => q.time));

            updateMap();
        })
        .catch(error => console.error("Error fetching earthquake data:", error));
}

// Update the map by adding earthquakes that have occurred up to `currentTime`
function updateMap() {
    map.eachLayer(layer => {
        if (layer instanceof L.Circle) map.removeLayer(layer);
    });

    earthquakes.forEach(quake => {
        if (quake.time <= currentTime) {
            let age = currentTime - quake.time;
            let color = getColorByAge(age);

            L.circle([quake.lat, quake.lng], {
                color,
                fillColor: color,
                fillOpacity: 0.6,
                radius: quake.mag * 50000
            }).addTo(map);
        }
    });
}

// Determine color based on earthquake age
function getColorByAge(age) {
    if (age < 3600000) return "red";         // Less than 1 hour old
    if (age < 86400000) return "orange";     // Less than 1 day old
    if (age < 604800000) return "yellow";    // Less than 1 week old
    if (age < 2592000000) return "white";    // Less than 1 month old
    return null; // Older than 1 month (won't be shown)
}

// Start playback
document.getElementById("play").addEventListener("click", () => {
    if (playing) {
        clearInterval(interval);
        playing = false;
    } else {
        interval = setInterval(() => {
            currentTime += 86400000; // Move forward one day

            if (currentTime > Date.now()) {
                if (loop) {
                    currentTime = Math.min(...earthquakes.map(q => q.time)); // Restart at the beginning
                } else {
                    clearInterval(interval);
                    playing = false;
                }
            }

            updateMap();
        }, playbackSpeed);
        playing = true;
    }
});

// Speed control
document.getElementById("speed").addEventListener("input", (e) => {
    playbackSpeed = 2000 - e.target.value;
});

// Loop toggle
document.getElementById("loop").addEventListener("change", (e) => {
    loop = e.target.checked;
});

window.onload = initMap;
