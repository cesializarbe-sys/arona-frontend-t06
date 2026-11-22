import React from 'react';
import { Link } from 'react-router-dom';

export interface AccessDeniedViewProps {
  title?: string;
  message?: string;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  title = 'Acceso Denegado (403)',
  message = 'No cuenta con los permisos necesarios para acceder a esta sección. Esta área está reservada para perfiles con rol de Administrador.',
}) => {
  return (
    <div
      role="alert"
      className="max-w-lg mx-auto my-12 arona-card p-8 text-center animate-fade-in"
    >
      <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
        <span className="material-icons-outlined text-3xl">gpp_bad</span>
      </div>
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/dashboard" className="arona-btn-primary no-underline">
          <span className="material-icons-outlined text-base">home</span>
          Volver al Inicio
        </Link>
        <Link to="/mis-datos" className="arona-btn-outline no-underline">
          <span className="material-icons-outlined text-base">person</span>
          Ver mi perfil y rol
        </Link>
      </div>
    </div>
  );
};
