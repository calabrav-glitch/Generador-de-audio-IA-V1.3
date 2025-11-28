import React from 'react';
import { IconWaveform } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="flex items-center gap-3 mb-8 pt-4">
      <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/30">
        <IconWaveform />
      </div>
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          EchoMuse
        </h1>
        <p className="text-slate-400 text-sm">Transforma tus ideas en voz</p>
      </div>
    </header>
  );
};

export default Header;