import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DoodleStar, DoodleSparkle, DoodleCurvedArrow, WavyCoralUnderline } from '../components/Doodles';

export const NotFoundPage: React.FC = () => {
  const { currentUser } = useApp();
  const isMember = currentUser?.role === 'member';

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-12 relative overflow-hidden">
      <DoodleStar className="w-10 h-10 absolute top-8 left-1/4" color="#FDE047" />
      <DoodleSparkle className="w-8 h-8 absolute top-14 right-1/4" color="#1A45E5" />
      <DoodleStar className="w-7 h-7 absolute bottom-12 left-1/3" color="#DDD6FE" />

      <div className="relative inline-block my-4">
        <h1 className="font-serif italic font-extrabold text-[110px] sm:text-[160px] leading-none text-cobalt select-none tracking-tighter">
          404
        </h1>

        <div className="inline-block bg-pastel-coral text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider px-5 py-2 rounded-full shadow-md border-2 border-ink transform -rotate-6 -mt-6 relative z-10">
          Halaman Tidak Ditemukan
        </div>
      </div>

      <div className="w-40 mx-auto my-3">
        <WavyCoralUnderline />
      </div>

      <p className="max-w-md text-sm sm:text-base text-ink/75 font-medium mt-2">
        Maaf, halaman yang Anda tuju tidak tersedia.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <DoodleCurvedArrow className="w-10 h-10 hidden sm:block" />
        <Link
          to={isMember ? '/transactions' : '/dashboard'}
          className="px-7 py-3.5 rounded-full bg-ink hover:bg-cobalt text-white font-bold text-sm tracking-wide inline-flex items-center gap-2 shadow-md transition-all"
        >
          <span>{isMember ? 'Kembali ke Transaksi' : 'Kembali ke Dashboard'}</span>
          <span className="text-base leading-none">↗</span>
        </Link>
      </div>
    </div>
  );
};
