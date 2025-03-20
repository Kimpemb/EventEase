// components/MapComponent.js
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import react-leaflet with SSR disabled
const Map = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });

const MapComponent = () => {
  return (
    <div style={{ height: '500px', width: '100%' }}>
      <Map center={[5.6037, -0.1870]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </Map>
    </div>
  );
};

export default MapComponent;
