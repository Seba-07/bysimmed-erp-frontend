'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const menuItems = [
    { href: '/', icon: '🏠', label: 'Inicio' },
    {
      section: 'Ventas',
      items: [
        { href: '/ventas/control', icon: '📊', label: 'Control de Ventas' },
        { href: '/ventas/registro', icon: '📝', label: 'Registro de Ventas' },
        { href: '/ventas/post-venta', icon: '🔧', label: 'Post-Venta' },
      ]
    },
    {
      section: 'Finanzas',
      items: [
        { href: '/finanzas/compras', icon: '🛒', label: 'Compras' },
        { href: '/finanzas/proveedores', icon: '🏢', label: 'Proveedores' },
        { href: '/finanzas/gastos', icon: '💰', label: 'Gastos' },
        { href: '/finanzas/cuentas', icon: '🏦', label: 'Cuentas' },
      ]
    },
    {
      section: 'Operaciones',
      items: [
        { href: '/inventario', icon: '📦', label: 'Inventario' },
        { href: '/produccion', icon: '🏭', label: 'Producción' },
        { href: '/ordenes', icon: '📋', label: 'Órdenes' },
        { href: '/reposiciones', icon: '🔄', label: 'Reposiciones' },
      ]
    }
  ]

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-logo">
            {collapsed ? 'bS' : 'bySIMMED'}
          </h1>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => {
            if ('section' in item) {
              return (
                <div key={idx} className="nav-section">
                  {!collapsed && <div className="section-title">{item.section}</div>}
                  {item.items?.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={`nav-item ${pathname === subItem.href ? 'active' : ''}`}
                      title={collapsed ? subItem.label : ''}
                    >
                      <span className="nav-icon">{subItem.icon}</span>
                      {!collapsed && <span className="nav-label">{subItem.label}</span>}
                    </Link>
                  ))}
                </div>
              )
            } else {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                </Link>
              )
            }
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <span className="nav-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {!collapsed && <span className="nav-label">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </button>
        </div>
      </aside>

      {/* Spacer para el contenido principal */}
      <div className={`sidebar-spacer ${collapsed ? 'collapsed' : ''}`} />
    </>
  )
}
