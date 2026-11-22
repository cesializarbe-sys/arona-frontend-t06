import React from 'react';
import { NavLink } from 'react-router-dom';

export const AnalyticsSubNav: React.FC = () => {
  const navItems = [
    {
      to: '/analitica',
      end: true,
      icon: 'space_dashboard',
      label: 'Dashboard & Análisis (4 Endpoints)',
    },
    {
      to: '/analitica/indicadores',
      end: false,
      icon: 'insights',
      label: 'Indicadores Históricos y Dinámicos (12 Endpoints)',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#EAE5D9] px-6 pt-5 pb-0 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#2A241E] tracking-tight">Analítica Agrícola</h1>
          <p className="text-xs text-[#8C8574] mt-0.5">
            Campaña 2026 · Agrícola Arona S.A. · Monitoreo multi-base de datos (MongoDB + SQL Server)
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F3] border border-[#EAE5D9] text-[11px] font-semibold text-[#557A38] self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-[#557A38]" />
          Vista Administrador · 16 Endpoints Activos
        </div>
      </div>

      <nav
        aria-label="Navegación interna de analítica"
        className="flex flex-wrap items-center gap-6 border-t border-[#F0ECE1]"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2 py-3.5 text-xs font-bold border-b-2 transition-all no-underline select-none ${
                isActive
                  ? 'border-[#557A38] text-[#3B5924]'
                  : 'border-transparent text-[#8C8574] hover:text-[#2A241E]'
              }`
            }
          >
            <span className="material-icons-outlined text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AnalyticsSubNav;
