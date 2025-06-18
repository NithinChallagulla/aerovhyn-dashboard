let map;

function initMap() {
  // Try to get user's current location
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const userLocation = { lat: userLat, lng: userLng };

      // Create map centered at user's location
      map = new google.maps.Map(document.getElementById("map"), {
        zoom: 10,
        center: userLocation,
      });

      // Marker for user's location
      new google.maps.Marker({
        position: userLocation,
        map,
        title: "You are here",
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });

      // Generate and add 10 random markers within 50 km
      for (let i = 0; i < 10; i++) {
        const randomPos = generateRandomLocation(userLat, userLng, 50);
        new google.maps.Marker({
          position: randomPos,
          map,
          title: `Random Marker ${i + 1}`,
        });
      }
    },
    (error) => {
      console.error("Geolocation failed:", error.message);
    }
  );
}

// Generate a random lat/lng within given km radius
function generateRandomLocation(lat, lng, radiusKm) {
  const radiusInDegrees = radiusKm / 111; // Approximation

  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const newLat = lat + w * Math.cos(t);
  const newLng = lng + w * Math.sin(t) / Math.cos((lat * Math.PI) / 180);

  return { lat: newLat, lng: newLng };
}
