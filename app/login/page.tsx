"use client"; // Required for components using state or effects in Next.js 13

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from 'react'; // Import useState for managing state
import { useRouter } from 'next/navigation'; // Import useRouter for navigation

export default function LoginPage() {
  const router = useRouter(); // Initialize useRouter
  const [email, setEmail] = useState(''); // State for email
  const [password, setPassword] = useState(''); // State for password
  const [errorMessage, setErrorMessage] = useState(''); // State for error message

  // Valid credentials for demonstration purposes
  const validCredentials = [
    { email: "vaibhavninja1234@gmail.com",username:"Vaibhav" ,password: "VSH123" },
    { email: "priyaharisun2004@gmail.com",username:"HariPriya", password: "SHp456" },
    { email: "psbbsrb170188@gmail.com", username:"Srujana",password: "SrB789*8" },
    { email: "msharathgowda7@gmail.com",username:"Sharath", password: "mSG149" }
  ];

  const handleLogin = (e: { preventDefault: () => void; }) => {
    e.preventDefault(); // Prevent the default form submission

    // Check credentials
    const isValid = validCredentials.some(cred => cred.email === email && cred.password === password);

    if (isValid) {
      // Navigate to the dashboard if credentials are valid
      router.push('/dashboard');
    } else {
      // Show error message if credentials are invalid
      setErrorMessage('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}> {/* Add onSubmit handler */}
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  placeholder="Enter your email" 
                  value={email} // Controlled input
                  onChange={(e) => setEmail(e.target.value)} // Update email state
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  value={password} // Controlled input
                  onChange={(e) => setPassword(e.target.value)} // Update password state
                />
              </div>
              {errorMessage && (
                <p className="mt-2 text-sm text-red-600 text-center">{errorMessage}</p> // Display error message
              )}
            </div>
            <Button type="submit" className="w-full mt-4">Log In</Button> {/* Ensure button triggers form submission */}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="mt-2 text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
