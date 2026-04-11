// server/pincodeDB.js — Pincode → coordinates (mirrors AppContext PINCODE_DB)
const PINCODE_DB = {
  '400001': { city: 'Mumbai', lat: 18.9387, lng: 72.8353, area: 'Fort' },
  '400002': { city: 'Mumbai', lat: 18.9489, lng: 72.8345, area: 'Masjid Bunder' },
  '400053': { city: 'Mumbai', lat: 19.1136, lng: 72.8697, area: 'Andheri West' },
  '400069': { city: 'Mumbai', lat: 19.0748, lng: 72.8856, area: 'Malad' },
  '400078': { city: 'Mumbai', lat: 19.0459, lng: 72.9199, area: 'Powai' },
  '400092': { city: 'Mumbai', lat: 19.1663, lng: 72.9455, area: 'Borivali' },
  '110001': { city: 'Delhi', lat: 28.6315, lng: 77.2167, area: 'Connaught Place' },
  '110032': { city: 'Delhi', lat: 28.7041, lng: 77.1025, area: 'Rohini' },
  '110045': { city: 'Delhi', lat: 28.6562, lng: 77.0662, area: 'Dwarka' },
  '110019': { city: 'Delhi', lat: 28.5355, lng: 77.2533, area: 'Okhla' },
  '560001': { city: 'Bangalore', lat: 12.9716, lng: 77.5946, area: 'MG Road' },
  '560034': { city: 'Bangalore', lat: 12.9352, lng: 77.6245, area: 'Koramangala' },
  '560085': { city: 'Bangalore', lat: 12.9078, lng: 77.6476, area: 'HSR Layout' },
  '560076': { city: 'Bangalore', lat: 13.0236, lng: 77.5716, area: 'Rajajinagar' },
  '600001': { city: 'Chennai', lat: 13.0827, lng: 80.2707, area: 'Parrys' },
  '600017': { city: 'Chennai', lat: 13.0418, lng: 80.2341, area: 'T Nagar' },
  '600042': { city: 'Chennai', lat: 12.9698, lng: 80.1992, area: 'Velachery' },
  '500001': { city: 'Hyderabad', lat: 17.3659, lng: 78.4749, area: 'Charminar' },
  '500034': { city: 'Hyderabad', lat: 17.4126, lng: 78.4480, area: 'Banjara Hills' },
  '500072': { city: 'Hyderabad', lat: 17.4935, lng: 78.3960, area: 'Kukatpally' },
  '700001': { city: 'Kolkata', lat: 22.5726, lng: 88.3639, area: 'Dalhousie' },
  '700029': { city: 'Kolkata', lat: 22.5355, lng: 88.3476, area: 'Alipore' },
  '411001': { city: 'Pune', lat: 18.5204, lng: 73.8567, area: 'Pune City' },
  '411007': { city: 'Pune', lat: 18.5462, lng: 73.8346, area: 'Shivajinagar' },
  '733201': { city: 'D/Dinajpur', lat: 25.6107, lng: 88.0849, area: 'Dangram' },
  '733202': { city: 'D/Dinajpur', lat: 25.6150, lng: 88.0900, area: 'Balurghat' },
};

const ZONE_FALLBACKS = {
  '1': { city: 'Delhi', lat: 28.7041, lng: 77.1025, area: 'Delhi Region' },
  '4': { city: 'Mumbai', lat: 19.0760, lng: 72.8777, area: 'Mumbai Region' },
  '5': { city: 'Hyderabad', lat: 17.3850, lng: 78.4867, area: 'Hyderabad Region' },
  '6': { city: 'Chennai', lat: 13.0827, lng: 80.2707, area: 'Chennai Region' },
  '7': { city: 'Kolkata', lat: 22.5726, lng: 88.3639, area: 'Kolkata Region' },
  '8': { city: 'Bangalore', lat: 12.9716, lng: 77.5946, area: 'Bangalore Region' },
};

export function getPincodeCoords(pincode) {
  if (!pincode) return { city: 'India', lat: 20.5937, lng: 78.9629, area: 'Unknown' };
  const pin = String(pincode).trim();
  if (PINCODE_DB[pin]) return { ...PINCODE_DB[pin], pincode: pin };
  const prefix3 = pin.slice(0, 3);
  const match3 = Object.entries(PINCODE_DB).find(([k]) => k.startsWith(prefix3));
  if (match3) return { ...match3[1], pincode: pin, area: `${pin} area` };
  return ZONE_FALLBACKS[pin[0]] || { city: 'India', lat: 20.5937, lng: 78.9629, area: 'Unknown' };
}
