import React from 'react';
import { MapPin, Mail, Phone, Clock } from 'lucide-react';

export default function ContactInfo() {
  return (
    <section className="py-20 bg-white dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-4">Hubungi Kami</h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Kami siap membantu mensukseskan proyek infrastruktur Anda. Jangan ragu untuk menghubungi tim ahli kami untuk konsultasi awal.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 text-amber-500 border border-slate-200 dark:border-slate-700">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Alamat Kantor Pusat</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Jl. Ahmad Yani KM 5, Banjarmasin<br/>Kalimantan Selatan, Indonesia</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 text-blue-500 border border-slate-200 dark:border-slate-700">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Email Resmi</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">admin@prisma-group.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 text-emerald-500 border border-slate-200 dark:border-slate-700">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Telepon / WhatsApp</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">+62 811-2345-6789</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kotak Pesan / Peta (Visual) */}
          <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Jam Operasional</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/60 pb-4">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Senin - Jumat</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><Clock className="w-4 h-4"/> 08:00 - 17:00 WITA</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/60 pb-4">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Sabtu</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1.5"><Clock className="w-4 h-4"/> 08:00 - 13:00 WITA</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Minggu / Libur Nasional</span>
                <span className="text-sm font-bold text-rose-500 flex items-center gap-1.5">Tutup</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}