"use client";

import React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

const MOTIVATION: string[] = [
  "Langkah kecil hari ini bisa jadi lompatan besar esok hari.",
  "Tetap bergerak. Pelan bukan berarti berhenti.",
  "Rezeki kadang datang lewat pintu yang tak disangka.",
  "Belajar satu skill baru = menambah satu peluang baru.",
  "Kamu belum kalah, kamu baru saja mulai ulang.",
  "Hidup boleh keras, tapi semangatmu harus lebih keras.",
  "Setiap kesulitan membawa peluang baru, asal mau berjuang.",
  "Tak perlu sempurna untuk memulai, cukup berani melangkah.",
  "Bangkit, belajar, dan bertahan. Satu hari nanti terbayar lunas.",
  "Percayalah, badai tak selamanya hujan.",
];

const HomePage = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % MOTIVATION.length);
    }, 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-slate-800">
      <div className="max-w-7xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Ilustrasi keadaan sosial ekonomi */}
        <div className="relative w-full h-[380px] md:h-[600px] rounded-2xl overflow-hidden shadow-md ring-1 ring-slate-200">
          <Image
            src="/homepageimage.svg" // ganti sesuai nama file kamu di folder /public
            alt="Homepage Image"
            fill
            priority
            className="object-contain md:object-cover"
          />
          {/* Lapisan gradasi tipis agar teks nanti lebih kontras jika ditambahkan */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Konten teks */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#03959f] leading-snug">
              Hidup Tak Mudah, Tapi Kita Tak Menyerah.
            </h1>
            <p className="mt-3 text-base md:text-lg text-slate-600">
              Di tengah harga bahan pokok yang mencekik dan sulitnya mencari
              pekerjaan, banyak orang hanya bertahan hidup, belum benar-benar
              sejahtera. Namun di setiap kesulitan, selalu ada ruang untuk
              tumbuh dan berjuang.
            </p>
          </div>

          {/* Motivasi Dinamis */}
          <div className="relative">
            <div className="rounded-xl bg-[#03959f]/10 border border-[#03959f]/30 p-4 shadow-sm transition-all duration-300 w-fit">
              <p className="text-[#03959f] text-lg md:text-xl font-semibold">
                “{MOTIVATION[idx]}”
              </p>
            </div>
          </div>

          {/* Tombol Login */}
          <div className="pt-2">
            <Link href="/login" prefetch>
              <Button className="bg-[#03959f] hover:bg-[#02848d] text-white px-6 py-5 text-base font-semibold shadow-sm hover:cursor-pointer">
                Masuk untuk Melangkah
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            *Simulasi ilustratif — menggambarkan realitas sosial dan ekonomi
            Indonesia tahun saat ini.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
