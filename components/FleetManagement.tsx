"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import axios from "axios"

const initialVehicles = [
  { id: 1, name: "Truck 001", type: "Delivery Van", status: "Active", lastMaintenance: "2023-05-15" },
  { id: 2, name: "Truck 002", type: "Box Truck", status: "In Maintenance", lastMaintenance: "2023-06-20" },
  { id: 3, name: "Truck 003", type: "Refrigerated Truck", status: "Active", lastMaintenance: "2023-04-30" },
]

const BASE_URL = 'https://onfleet.com/api/v2';
const API_KEY = Buffer.from('d1018b7587bf159a9a1f8bb94f1bc9cd').toString('base64');

const onfleetAPI = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Basic ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Function to fetch available drivers
const getDrivers = async () => {
  try {
    const response = await onfleetAPI.get('/workers');
    return response.data || []; // Ensure an empty array is returned if no data
  } catch (error: unknown) {
    // Type assertion for error
    if (axios.isAxiosError(error)) {
      console.error('Error fetching drivers:', error.response ? error.response.data : error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    return [];
  }
};

// Function to create a new delivery task
const createTask = async (destinationAddress: string, recipientName: string, recipientPhone: string) => {
  const taskData = {
    destination: {
      address: { unparsed: destinationAddress },
    },
    recipients: [
      {
        name: recipientName,
        phone: recipientPhone,
      },
    ],
    notes: 'Handle with care',
    serviceTime: 300, // Task duration in seconds
  };

  try {
    const response = await onfleetAPI.post('/tasks', taskData);
    return response.data;
  } catch (error: unknown) {
    // Type assertion for error
    if (axios.isAxiosError(error)) {
      console.error('Error creating task:', error.response ? error.response.data : error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    return null;
  }
};

// Function to assign a task to a driver
const assignTaskToDriver = async (taskId: string, driverId: string) => {
  const updateData = {
    worker: driverId,
  };

  try {
    await onfleetAPI.put(`/tasks/${taskId}`, updateData);
    console.log(`Task ${taskId} assigned to Driver ${driverId}`);
  } catch (error: unknown) {
    // Type assertion for error
    if (axios.isAxiosError(error)) {
      console.error('Error assigning task:', error.response ? error.response.data : error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

export function FleetManagement() {
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [newVehicle, setNewVehicle] = useState({ name: "", type: "", status: "Active", lastMaintenance: "" })
  const [destinationAddress, setDestinationAddress] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [activeTrucks, setActiveTrucks] = useState<string[]>([]) // Specify type for active trucks
  const [noDriversMessage, setNoDriversMessage] = useState<string>("") // Specify type for message

  // Function to handle adding a new vehicle
  const handleAddVehicle = () => {
    if (newVehicle.name && newVehicle.type && newVehicle.lastMaintenance) {
      setVehicles([...vehicles, { ...newVehicle, id: vehicles.length + 1 }]);
      setNewVehicle({ name: "", type: "", status: "Active", lastMaintenance: "" });
    }
  }

  // Function to calculate delivery and get active trucks
  const calculateDelivery = async () => {
    // Reset the no drivers message
    setNoDriversMessage("");

    // Filter vehicles for active ones and set them in the activeTrucks state
    const activeVehicleNames = vehicles
      .filter(vehicle => vehicle.status === "Active") // Filter for active vehicles
      .map(vehicle => vehicle.name); // Extract their names
    
    setActiveTrucks(activeVehicleNames); // Update the state with active truck names

    // Fetch drivers from Onfleet
    const drivers = await getDrivers();
    if (drivers.length === 0) {
      setNoDriversMessage("No drivers present."); // Set message if no drivers are available
      return;
    }

    // Create a delivery task
    const task = await createTask(destinationAddress, recipientName, recipientPhone);
    if (!task) {
      console.error("Task creation failed.");
      return;
    }

    // Assign the task to the first driver
    const driverId = drivers[0]._id; // Assuming we assign to the first driver
    await assignTaskToDriver(task._id, driverId);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Fleet Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Maintenance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.name}</TableCell>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell>{vehicle.status}</TableCell>
                  <TableCell>{vehicle.lastMaintenance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Display Active Trucks */}
          {activeTrucks.length > 0 && (
            <div className="mt-4">
              <h3>Active Trucks:</h3>
              <ul>
                {activeTrucks.map((truck, index) => (
                  <li key={index}>{truck}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Display No Drivers Message */}
          {noDriversMessage && (
            <div className="mt-4 text-red-500">
              {noDriversMessage}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog for Adding New Vehicle */}
      <Dialog>
        <DialogTrigger asChild>
          <Button>Add New Vehicle</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>Enter the details of the new vehicle to add to the fleet.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Vehicle Details Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={newVehicle.name} onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Input id="type" value={newVehicle.type} onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastMaintenance" className="text-right">Last Maintenance</Label>
              <Input id="lastMaintenance" type="date" value={newVehicle.lastMaintenance} onChange={(e) => setNewVehicle({ ...newVehicle, lastMaintenance: e.target.value })} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddVehicle}>Add Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Details Inputs */}
      <div className="grid gap-4">
        <h3>Delivery Details:</h3>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="destinationAddress" className="text-right">Destination Address</Label>
          <Input id="destinationAddress" value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="recipientName" className="text-right">Recipient's Name</Label>
          <Input id="recipientName" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="recipientPhone" className="text-right">Recipient's Phone No</Label>
          <Input id="recipientPhone" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="col-span-3" />
        </div>
        <Button onClick={calculateDelivery}>Calculate Delivery</Button>
      </div>
    </div>
  )
}
