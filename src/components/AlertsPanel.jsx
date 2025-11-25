// src/components/AlertsPanel.jsx
import AlertsPanel from "./AlertsPanel"; // make sure path is correct

export default function DashboardPage() {
  const [online, setOnline] = useState(true);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState(0);

  // ... your existing logic for live orders, earnings, confetti, etc.

  return (
    <div className="min-h-screen bg-[#fff9f4] p-5 space-y-6">
      {/* Alerts Panel */}
      <AlertsPanel />

      {/* Online/Offline toggle */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow">
        <div>
          <h2 className="font-semibold text-lg">You are {online ? "Online" : "Offline"}</h2>
          <p className="text-sm text-gray-500">
            Toggle to go {online ? "offline" : "online"}
          </p>
        </div>
        <button
          onClick={() => setOnline(!online)}
          className={`px-4 py-2 rounded-xl text-white ${
            online ? "bg-green-500" : "bg-gray-400"
          }`}
        >
          {online ? "Go Offline" : "Go Online"}
        </button>
      </div>

      {/* Earnings / Orders / Ratings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="text-sm text-gray-500">Today's Sales</h3>
          <p className="text-xl font-semibold text-orange-500">₹{earnings}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="text-sm text-gray-500">Total Orders</h3>
          <p className="text-xl font-semibold text-orange-500">{orders.length}</p>
        </div>
        {/* Add more cards as needed */}
      </div>

      {/* Rest of your DashboardPage content */}
    </div>
  );
}
