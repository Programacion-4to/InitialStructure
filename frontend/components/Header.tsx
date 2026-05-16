"use client";

import { useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { logout, getSelectedProfile } from "@/lib/api";

interface HeaderProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onLogout: () => void;
}

const navItems = [
  { id: "inicio", label: "Inicio" },
  { id: "catalogo", label: "Catalogo" },
  { id: "peliculas", label: "Peliculas" },
  { id: "series", label: "Series" },
  { id: "mi-lista", label: "Mi lista" },
];

export function Header({ activeSection, onNavigate, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profile = getSelectedProfile();

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background to-transparent">
      <div className="px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => onNavigate("inicio")} className="shrink-0">
            <BrandLogo size="md" />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 ml-10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  activeSection === item.id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side - Profile & Logout */}
          <div className="hidden md:flex items-center gap-4">
            {profile && (
              <div className="flex items-center gap-2 text-foreground">
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, #009246 0%, #009246 33%, #ffffff 33%, #ffffff 66%, #ce2b37 66%, #ce2b37 100%)`,
                  }}
                >
                  {profile.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm">{profile.nombre}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:text-primary transition-colors"
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-foreground p-2"
            aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
            <nav className="flex flex-col gap-2 mt-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-2 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-border">
              {profile && (
                <div className="flex items-center gap-2 px-4 py-2 text-foreground">
                  <User size={18} />
                <span className="text-sm">
                  {profile.nombre}
                  {profile.es_infantil && (
                    <span className="ml-1 text-xs text-tito-green">(Infantil)</span>
                  )}
                </span>
                </div>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary transition-colors w-full"
              >
                <LogOut size={18} />
                Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
