import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DEFAULT_CENTER = [40.748817, -73.985428]

const HELP_CENTERS = [
  {
    id: 'desk1',
    position: [40.7506, -73.9878],
    name: 'Help Desk 1',
    instructions: 'North plaza under the white tent. Bring ID for wristband verification.',
  },
  {
    id: 'medical',
    position: [40.7474, -73.984],
    name: 'Medical Center',
    instructions: 'South entrance near Gate C. Trained EMTs; prioritize breathing issues.',
  },
  {
    id: 'police',
    position: [40.7468, -73.9885],
    name: 'Police Post',
    instructions: 'Coordination with venue security. Use for threats or unaccompanied minors.',
  },
  {
    id: 'lostfound',
    position: [40.7498, -73.9829],
    name: 'Lost & Found',
    instructions: 'East concourse level 1. Hours match main stage programming.',
  },
]

export default function HelpCentersMap() {
  useEffect(() => {
    const icon = L.icon({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
    L.Marker.prototype.options.icon = icon
  }, [])

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#111827] pb-10">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-black text-white">Help centers</h1>
        <p className="mt-2 max-w-2xl text-gray-300">
          Venue map with fixed help locations for this deployment. Default view centers
          on a major event district for demo purposes.
        </p>
        <div className="mt-6 h-[480px] overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={15}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {HELP_CENTERS.map((p) => (
              <Marker key={p.id} position={p.position}>
                <Popup>
                  <div className="text-gray-900">
                    <p className="font-bold">{p.name}</p>
                    <p className="mt-2 text-sm">{p.instructions}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
