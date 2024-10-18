"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const vehicleTypes = [
  { value: "car", label: "Car", factor: 0.12 },
  { value: "van", label: "Van", factor: 0.17 },
  { value: "truck", label: "Truck", factor: 0.3 },
  { value: "bus", label: "Bus", factor: 0.05 },
]

const fuelTypes = [
  { value: "petrol", label: "Petrol", factor: 2.31 },
  { value: "diesel", label: "Diesel", factor: 2.68 },
  { value: "electric", label: "Electric", factor: 0 },
  { value: "hybrid", label: "Hybrid", factor: 1.84 },
]

const distanceUnits = [
  { value: "km", label: "Kilometers", factor: 1 },
  { value: "miles", label: "Miles", factor: 1.60934 },
]

export default function CO2EmissionsContent() {
  const [vehicleType, setVehicleType] = useState(vehicleTypes[0].value)
  const [fuelType, setFuelType] = useState(fuelTypes[0].value)
  const [initialOdometer, setInitialOdometer] = useState("")
  const [finalOdometer, setFinalOdometer] = useState("")
  const [distanceUnit, setDistanceUnit] = useState(distanceUnits[0].value)
  const [distance, setDistance] = useState<number | null>(null)
  const [result, setResult] = useState<number | null>(null)

  const calculateEmissions = () => {
    const selectedVehicle = vehicleTypes.find(v => v.value === vehicleType)
    const selectedFuel = fuelTypes.find(f => f.value === fuelType)
    const selectedUnit = distanceUnits.find(u => u.value === distanceUnit)

    if (selectedVehicle && selectedFuel && selectedUnit && initialOdometer && finalOdometer) {
      const initial = parseFloat(initialOdometer)
      const final = parseFloat(finalOdometer)
      
      // Calculate distance traveled
      const rawDistance = final - initial
      const distanceInKm = rawDistance * selectedUnit.factor
      setDistance(parseFloat(distanceInKm.toFixed(2)))

      // Calculate emissions
      const emissions = distanceInKm * selectedVehicle.factor * selectedFuel.factor
      setResult(parseFloat(emissions.toFixed(2)))
    }
  }

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
                {fuelTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="initialOdometer">Initial Odometer Reading</Label>
            <div className="flex space-x-2">
              <Input
                id="initialOdometer"
                type="number"
                placeholder="Enter initial reading"
                value={initialOdometer}
                onChange={(e) => setInitialOdometer(e.target.value)}
                className="flex-grow"
              />
              <Select value={distanceUnit} onValueChange={setDistanceUnit}>
                <SelectTrigger id="distanceUnit" className="w-[120px]">
                  <SelectValue placeholder="Unit" />
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="finalOdometer">Final Odometer Reading</Label>
            <div className="flex space-x-2">
              <Input
                id="finalOdometer"
                type="number"
                placeholder="Enter final reading"
                value={finalOdometer}
                onChange={(e) => setFinalOdometer(e.target.value)}
                className="flex-grow"
              />
              <Select value={distanceUnit} onValueChange={setDistanceUnit}>
                <SelectTrigger id="distanceUnit" className="w-[120px]">
                  <SelectValue placeholder="Unit" />
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
          </div>
          <Button onClick={calculateEmissions} className="w-full">Calculate Emissions</Button>
        </CardContent>
      </Card>
      {result !== null && distance !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Result</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{result} kg CO2</p>
            <p className="text-muted-foreground">Estimated CO2 emissions for your trip</p>
            <p className="text-muted-foreground">Distance traveled: {distance} km</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
