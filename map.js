function initMap() {
  const userLocation = { lat: 16.5028, lng: 80.6506 };

  const map = new google.maps.Map(document.getElementById("map"), {
    center: userLocation,
    zoom: 10,
    styles: [ // Dark Mode Style
      { elementType: "geometry", stylers: [{ color: "#212121" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
      { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
      { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
      { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
      { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
      { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] },
    ],
  });

  // Add a marker for the user location
  new google.maps.Marker({
    position: userLocation,
    map: map,
    title: "Your Location",
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: "#00ffcc",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#ffffff",
    },
  });

  // Generate 10 random markers within 50km
  const randomMarkers = 10;
  const radiusInKm = 50;

  for (let i = 0; i < randomMarkers; i++) {
    const randomPoint = generateRandomLocation(userLocation, radiusInKm);
    new google.maps.Marker({
      position: randomPoint,
      map: map,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: "#ff4081",
        fillOpacity: 0.9,
        strokeWeight: 1,
        strokeColor: "#ffffff",
      },
      title: `Random Marker ${i + 1}`,
    });
  }

  function generateRandomLocation(center, radiusKm) {
    const y0 = center.lat;
    const x0 = center.lng;
    const rd = radiusKm / 111; // Approx radius in degrees

    const u = Math.random();
    const v = Math.random();

    const w = rd * Math.sqrt(u);
    const t = 2 * Math.PI * v;

    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    const newLat = y + y0;
    const newLng = x + x0;

    return { lat: newLat, lng: newLng };
  }
}
