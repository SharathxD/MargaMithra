"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LineChart, Truck, Package, Users, Settings } from "lucide-react"

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LineChart },
  { name: "Fleet Management", href: "/fleet", icon: Truck },
  { name: "Deliveries", href: "/deliveries", icon: Package },
  { name: "Drivers", href: "/drivers", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white shadow-md">
      <div className="p-4">
        <h1 className="text-2xl font-bold">MargaMithra</h1>
      </div>
      <nav className="mt-6">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-800 ${
                pathname === item.href ? "bg-gray-100 text-gray-800" : ""
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}