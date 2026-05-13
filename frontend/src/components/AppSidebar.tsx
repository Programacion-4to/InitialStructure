import { Link, useRouterState } from "@tanstack/react-router";
import {
  Users,
  Car,
  Wallet,
  DollarSign,
  Clock,
  Ticket,
  Send,
  ListOrdered,
  Trophy,
  BarChart3,
  History,
  Star,
  LayoutDashboard,
  IdCard,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const groups = [
  {
    label: "General",
    items: [{ to: "/", title: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Administración",
    items: [
      { to: "/pasajeros", title: "Pasajeros", icon: Users },
      { to: "/conductores", title: "Conductores", icon: IdCard },
      { to: "/vehiculos", title: "Vehículos", icon: Car },
      { to: "/tarifas", title: "Tarifas", icon: DollarSign },
      { to: "/multiplicadores", title: "Horarios pico", icon: Clock },
      { to: "/cupones", title: "Cupones", icon: Ticket },
    ],
  },
  {
    label: "Pasajero",
    items: [
      { to: "/metodos-pago", title: "Métodos de pago", icon: Wallet },
      { to: "/solicitar", title: "Solicitar viaje", icon: Send },
      { to: "/historial", title: "Historial", icon: History },
    ],
  },
  {
    label: "Operación",
    items: [
      { to: "/viajes", title: "Viajes", icon: ListOrdered },
      { to: "/calificaciones", title: "Calificaciones", icon: Star },
      { to: "/ranking", title: "Ranking conductores", icon: Trophy },
      { to: "/reportes", title: "Reportes mensuales", icon: BarChart3 },
    ],
  },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
            U
          </div>
          <span className="text-lg font-semibold tracking-tight">Uber Mock</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it) => (
                  <SidebarMenuItem key={it.to}>
                    <SidebarMenuButton asChild isActive={path === it.to}>
                      <Link to={it.to} className="flex items-center gap-2">
                        <it.icon className="h-4 w-4" />
                        <span>{it.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
