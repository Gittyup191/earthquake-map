let map;
let earthquakes = [];
let timelineRange = [Date.now() - 31536000000, Date.now()]; // Default to last year
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
            updateMap();
        })
        .catch(error => console.error("Error fetching earthquake data:", error));
}

// Update the map based on the timeline
function updateMap() {
    map.eachLayer(layer => {
        if (layer instanceof L.Circle) map.removeLayer(layer);
    });

    earthquakes.forEach(quake => {
        if (quake.time >= timelineRange[0] && quake.time <= timelineRange[1]) {
            let age = Date.now() - quake.time;
            let color = age < 3600000 ? "red" : age < 86400000 ? "orange" : age < 604800000 ? "yellow" : "white";
            L.circle([quake.lat, quake.lng], {
                color,
                fillColor: color,
                fillOpacity: 0.6,
                radius: quake.mag * 50000
            }).addTo(map);
        }
    });
}

// Timeline control
document.getElementById("timeline").addEventListener("input", (e) => {
    let daysAgo = e.target.value;
    timelineRange[0] = Date.now() - daysAgo * 86400000;
    updateMap();
});

// Playback control
document.getElementById("play").addEventListener("click", () => {
    if (playing) {
        clearInterval(interval);
        playing = false;
    } else {
        interval = setInterval(() => {
            timelineRange[0] += 86400000;
            timelineRange[1] += 86400000;
            if (timelineRange[1] > Date.now()) {
                if (loop) {
                    timelineRange = [Date.now() - 31536000000, Date.now()];
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
    playbackSpeed = 1000 - e.target.value;
});

// Loop toggle
document.getElementById("loop").addEventListener("change", (e) => {
    loop = e.target.checked;
});

window.onload = initMap;
