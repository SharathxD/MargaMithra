"use client"
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const vehicleTypes = [
  { value: "Car-Type-Mini", label: "Car-Type-Mini" },
  { value: "Car-Type-Supermini", label: "Car-Type-Supermini" },
  { value: "Car-Type-LowerMedium", label: "Car-Type-LowerMedium" },
  { value: "Car-Type-UpperMedium", label: "Car-Type-UpperMedium" },
  { value: "Car-Type-Executive", label: "Car-Type-Executive" },
  { value: "Car-Type-Luxury", label: "Car-Type-Luxury" },
  { value: "Car-Type-Sports", label: "Car-Type-Sports" },
  { value: "Car-Type-4x4", label: "Car-Type-4x4" },
  { value: "Car-Type-MPV", label: "Car-Type-MPV" },
  { value: "Car-Size-Small", label: "Car-Size-Small" },
  { value: "Car-Size-Medium", label: "Car-Size-Medium" },
  { value: "Car-Size-Large", label: "Car-Size-Large" },
  { value: "Car-Size-Average", label: "Car-Size-Average" },
  { value: "Motorbike-Size-Small", label: "Motorbike-Size-Small" },
  { value: "Motorbike-Size-Medium", label: "Motorbike-Size-Medium" },
  { value: "Motorbike-Size-Large", label: "Motorbike-Size-Large" },
  { value: "Motorbike-Size-Average", label: "Motorbike-Size-Average" },
  { value: "Bus-LocalAverage", label: "Bus-LocalAverage" },
  { value: "Bus-Coach", label: "Bus-Coach" },
  { value: "Taxi-Local", label: "Taxi-Local" },
  { value: "Train-National", label: "Train-National" },
  { value: "Train-Local", label: "Train-Local" },
  { value: "Train-Tram", label: "Train-Tram" },
];

const distanceUnits = [
  { value: "km", label: "Kilometers" },
  { value: "miles", label: "Miles" },
];

const fuelTypes = [
  { value: "Unknown", label: "Unknown" },
  { value: "Petrol", label: "Petrol" },
  { value: "Diesel", label: "Diesel" },
];

// Threshold CO2 emissions per km for different vehicle types
const co2Thresholds = {
  "Car-Type-Mini": 0.1,
  "Car-Type-Supermini": 0.09,
  "Car-Type-LowerMedium": 0.12,
  "Car-Type-UpperMedium": 0.15,
  "Car-Type-Executive": 0.2,
  "Car-Type-Luxury": 0.25,
  "Car-Type-Sports": 0.3,
  "Car-Type-4x4": 0.22,
  "Car-Type-MPV": 0.18,
  "Car-Size-Small": 0.1,
  "Car-Size-Medium": 0.15,
  "Car-Size-Large": 0.2,
  "Car-Size-Average": 0.14,
  "Motorbike-Size-Small": 0.05,
  "Motorbike-Size-Medium": 0.07,
  "Motorbike-Size-Large": 0.1,
  "Motorbike-Size-Average": 0.08,
  "Bus-LocalAverage": 0.5,
  "Bus-Coach": 0.45,
  "Taxi-Local": 0.2,
  "Train-National": 0.1,
  "Train-Local": 0.08,
  "Train-Tram": 0.06,
};

export default function CO2EmissionsContent() {
  const [vehicleType, setVehicleType] = useState(vehicleTypes[0].value);
  const [initialOdometer, setInitialOdometer] = useState("");
  const [finalOdometer, setFinalOdometer] = useState("");
  const [distanceUnit, setDistanceUnit] = useState(distanceUnits[0].value);
  const [fuelType, setFuelType] = useState(fuelTypes[0].value);
  const [result, setResult] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const calculateEmissions = async () => {
    setErrorMessage("");

    const initial = parseFloat(initialOdometer);
    const final = parseFloat(finalOdometer);

    if (isNaN(initial) || isNaN(final)) {
      setErrorMessage("Odometer readings must be valid numbers.");
      return;
    }

    if (initial >= final) {
      setErrorMessage("Final odometer must be greater than initial odometer.");
      return;
    }

    const rawDistance = final - initial;
    const distanceInKm =
      distanceUnit === "miles" ? rawDistance * 1.60934 : rawDistance;
    setDistance(parseFloat(distanceInKm.toFixed(2)));

    const url = "https://carbonsutra1.p.rapidapi.com/vehicle_estimate_by_type";
    const data = new URLSearchParams({
      vehicle_type: vehicleType,
      distance_value: distanceInKm.toString(),
      distance_unit: "km",
      fuel_type: fuelType,
      include_wtt: "N",
    });

    const options = {
      method: "POST",
      headers: {
        "x-rapidapi-key": "b0d55c2480msh3a736eef4169079p132c54jsneddca4f2751e",
        "x-rapidapi-host": "carbonsutra1.p.rapidapi.com",
        Authorization: "Bearer fQ98oU704xFvsnXcQLVDbpeCJHPglG1DcxiMLKfpeNEMGumlbzVf1lCI6ZBx",
      },
      body: data,
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const resultData = await response.json();

      // Extract the co2e_kg value from the API response
      if (resultData && resultData.data && resultData.data.co2e_kg) {
        const emissionsFromApi = parseFloat(resultData.data.co2e_kg);
        setResult(emissionsFromApi);

        // Calculate the estimated emissions based on the distance and threshold
        const threshold = co2Thresholds[vehicleType]; // Get the threshold for the selected vehicle type
        const estimatedEmissions = threshold * distanceInKm; // Calculate estimated emissions

        // Check if the emissions exceed the threshold
        if (emissionsFromApi > estimatedEmissions) {
          alert(
            "Warning: CO2 emitted is more than the threshold for this vehicle type."
          ); // Use browser alert for warning
        }
      } else {
        setErrorMessage("No emissions data returned from the API.");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(
        "An error occurred while fetching the emissions data. Please try again later."
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Calculate Emissions</CardTitle>
          <CardDescription>Enter vehicle details to calculate CO2 emissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger id="vehicleType">
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuelType">Fuel Type</Label>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger id="fuelType">
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                {fuelTypes.map((fuel) => (
                  <SelectItem key={fuel.value} value={fuel.value}>
                    {fuel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="initialOdometer">Initial Odometer (km or miles)</Label>
            <Input
              type="text"
              value={initialOdometer}
              onChange={(e) => setInitialOdometer(e.target.value)}
              placeholder="Initial Odometer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finalOdometer">Final Odometer (km or miles)</Label>
            <Input
              type="text"
              value={finalOdometer}
              onChange={(e) => setFinalOdometer(e.target.value)}
              placeholder="Final Odometer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="distanceUnit">Distance Unit</Label>
            <Select value={distanceUnit} onValueChange={setDistanceUnit}>
              <SelectTrigger id="distanceUnit">
                <SelectValue placeholder="Select distance unit" />
              </SelectTrigger>
              <SelectContent>
                {distanceUnits.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={calculateEmissions}>Calculate</Button>
          {errorMessage && <div className="text-red-500">{errorMessage}</div>}
          {result !== null && (
            <div className="mt-4">
              <strong>Calculated Emissions: </strong>
              {result.toFixed(2)} kg CO2e
            </div>
          )}
          {distance !== null && (
            <div className="mt-4">
              <strong>Distance Traveled: </strong>
              {distance.toFixed(2)} km
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
