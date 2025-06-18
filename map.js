window.initMap = () => {
  const center = { lat: 16.5062, lng: 80.6480 };

  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
      { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "on" }, { color: "#1a3646" }] },
      { featureType: "water", stylers: [{ color: "#0e1626" }] }
    ]
  });

  const getRandomLocation = (center, radiusKm) => {
    const r = radiusKm / 111;
    const u = Math.random();
    const v = Math.random();
    const w = r * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    return { lat: center.lat + w * Math.cos(t), lng: center.lng + w * Math.sin(t) };
  };

  Array.from({ length: 5 }, (_, i) => {
    const pos = getRandomLocation(center, 50);
    const marker = new google.maps.Marker({
      position: pos,
      map,
      title: `Pilot ${i + 1}`,
      icon: { url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" }
    });
    const info = new google.maps.InfoWindow({ content: `<div style='color:black;'>Pilot ${i + 1}</div>` });
    marker.addListener("click", () => info.open(map, marker));
  });
};
