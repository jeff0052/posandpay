import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, UtensilsCrossed, Users, Shield, Monitor, BarChart3,
  DollarSign, Settings, LogOut, Bell, Tag, Package, Map, ListOrdered,
  PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import uniwebLogo from "@/assets/uniweb-logo.jpg";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Menu", url: "/admin/menu", icon: UtensilsCrossed },
  { title: "Promotions", url: "/admin/promotions", icon: Tag },
  { title: "Inventory", url: "/admin/inventory", icon: Package },
  { title: "Floor Plan", url: "/admin/floorplan", icon: Map },
  { title: "Staff", url: "/admin/staff", icon: Shield },
  { title: "CRM", url: "/admin/crm", icon: Users },
  { title: "Queue", url: "/admin/queue", icon: ListOrdered },
  { title: "KDS Monitor", url: "/admin/kds", icon: Monitor },
  { title: "Sales Report", url: "/admin/sales", icon: BarChart3 },
  { title: "Finance", url: "/admin/finance", icon: DollarSign },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "bg-card border-r border-border flex flex-col shrink-0 transition-all duration-300",
        collapsed ? "w-[64px]" : "w-[236px]"
      )}>
        {/* Brand */}
        <div className={cn(
          "border-b border-border flex items-center",
          collapsed ? "px-3 py-[18px] justify-center" : "px-[18px] py-[18px] gap-2.5"
        )}>
          <img src={uniwebLogo} alt="Uniweb" className="w-9 h-9 rounded-[9px] flex-shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[13px] font-bold tracking-tight text-foreground leading-tight truncate">Uniweb Pte. Ltd.</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mt-0.5">Merchant Portal</div>
            </div>
          )}
        </div>

        {/* Merchant Strip */}
        {!collapsed ? (
          <div className="px-4 py-3 border-b border-border bg-accent">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Merchant</div>
            <div className="text-xs font-semibold text-foreground leading-tight truncate">Song Fa Bak Kut Teh</div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">MID-2024-0847</div>
          </div>
        ) : (
          <div className="px-2 py-2.5 border-b border-border bg-accent flex justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">SF</div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-2.5 px-2 overflow-y-auto pos-scrollbar">
          {navItems.map(item => {
            const active = location.pathname === item.url ||
              (item.url !== "/admin" && location.pathname.startsWith(item.url));
            return (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/admin"}
                className={cn(
                  "flex items-center rounded-lg text-[13px] font-medium mb-0.5 transition-all duration-200",
                  collapsed ? "justify-center px-0 py-[9px]" : "gap-2.5 px-2.5 py-[9px]",
                  active
                    ? "bg-primary/10 text-primary font-semibold nav-active-glow"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                activeClassName=""
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="h-[15px] w-[15px] flex-shrink-0" />
                {!collapsed && item.title}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle + Footer */}
        <div className="px-2 py-2 border-t border-border space-y-0.5">
          <button
            onClick={() => setCollapsed(c => !c)}
            className={cn(
              "flex items-center w-full py-[7px] rounded-lg text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
              collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-[15px] w-[15px]" /> : <PanelLeftClose className="h-[15px] w-[15px]" />}
            {!collapsed && "Collapse"}
          </button>
          <button className={cn(
            "flex items-center w-full py-[7px] rounded-lg text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
            collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"
          )}>
            <LogOut className="h-[15px] w-[15px]" />
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-[60px] bg-card border-b border-border flex items-center px-4 sm:px-7 gap-3.5 shrink-0 sticky top-0 z-50">
          <h2 className="text-[15px] font-semibold text-foreground flex-1 truncate">
            {navItems.find(n => location.pathname === n.url || (n.url !== "/admin" && location.pathname.startsWith(n.url)))?.title || "Dashboard"}
          </h2>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="relative p-[7px] rounded-lg hover:bg-accent transition-colors text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-[7px] h-[7px] bg-destructive rounded-full border-[1.5px] border-card" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold cursor-pointer">
              SF
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
