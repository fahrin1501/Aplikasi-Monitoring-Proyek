// CARI BLOK INI DI DALAM KurvaS.jsx DAN GANTI DENGAN INI:
  useEffect(() => {
    if (!scheduleData) return;

    // AMBIL GRAND TOTAL LANGSUNG DARI BACKEND
    const grandTotalRAB = scheduleData.grand_total_rab || 0;
    const allItems = [];
    
    // Tarik daftar item aman dari backend
    const rawRabData = scheduleData.rab_data;
    const safeRabData = Array.isArray(rawRabData) ? rawRabData : (rawRabData ? Object.values(rawRabData) : []);

    safeRabData.forEach(cat => {
      const safeItems = Array.isArray(cat?.items) ? cat.items : (cat?.items ? Object.values(cat.items) : []);
      safeItems.forEach(item => {
        if (!item.is_subheader) {
          allItems.push({ ...item, kategori_nama: cat.nama_kategori || 'Kategori' });
        }
      });
    });

    const progressList = allItems.map(item => {
      const baseBobot = grandTotalRAB > 0 ? (Number(item.total_harga || 0) / grandTotalRAB) * 100 : 0;
      const itemRealisasi = getSafeFloat(scheduleData.cumulative_actual?.[item.id]);
      const progressPercent = baseBobot > 0 ? (itemRealisasi / baseBobot) * 100 : 0;
      
      return { 
        id: item.id, 
        nama: item.uraian_pekerjaan, 
        volume: item.volume || 0, 
        satuan: item.satuan || '-', 
        bobot: baseBobot, 
        progress: Math.min(progressPercent, 100),
        realisasiAktual: itemRealisasi 
      };
    }).filter(item => item.realisasiAktual > 0); 
    
    setItemProgressData(progressList);

    const weekMap = {};
    const safeSchedules = Array.isArray(scheduleData.schedules) ? scheduleData.schedules : (scheduleData.schedules ? Object.values(scheduleData.schedules) : []);
    
    safeSchedules.forEach(s => {
      const w = parseInt(s.minggu_ke);
      if (!weekMap[w]) {
        weekMap[w] = {
          minggu_ke: w,
          bulan: s.bulan || null,
          tanggal_awal: s.tanggal_awal || null,
          tanggal_akhir: s.tanggal_akhir || null,
          target_kumulatif: 0
        };
      }
      weekMap[w].target_kumulatif += getSafeFloat(s.bobot_rencana);
      if (!weekMap[w].tanggal_awal && s.tanggal_awal) weekMap[w].tanggal_awal = s.tanggal_awal;
      if (!weekMap[w].tanggal_akhir && s.tanggal_akhir) weekMap[w].tanggal_akhir = s.tanggal_akhir;
    });

    const sortedWeeks = Object.values(weekMap).sort((a, b) => a.minggu_ke - b.minggu_ke);

    const dailyRealisasi = {};
    const dailyRealisasiWeeks = {};
    let maxReportedDayStr = '';

    const safeRealizations = Array.isArray(scheduleData.realizations) ? scheduleData.realizations : (scheduleData.realizations ? Object.values(scheduleData.realizations) : []);

    safeRealizations.forEach(r => {
      if (!r.tgl_input) return;
      const ymd = r.tgl_input.split('T')[0];
      dailyRealisasi[ymd] = getSafeFloat(dailyRealisasi[ymd]) + getSafeFloat(r.bobot_realisasi);
      if (r.minggu_ke) {
        dailyRealisasiWeeks[ymd] = r.minggu_ke;
      }
      if (!maxReportedDayStr || ymd > maxReportedDayStr) {
        maxReportedDayStr = ymd;
      }
    });

    const pStart = scheduleData.project_info?.tanggal_mulai ? new Date(scheduleData.project_info.tanggal_mulai) : new Date();
    pStart.setHours(0,0,0,0);
    const pEnd = scheduleData.project_info?.tanggal_selesai ? new Date(scheduleData.project_info.tanggal_selesai) : new Date(pStart.getTime() + (30 * 24 * 3600 * 1000));
    pEnd.setHours(0,0,0,0);

    let minDate = new Date(pStart);
    let maxDate = new Date(pEnd);

    sortedWeeks.forEach(w => {
      if (w.tanggal_awal) {
        const d = new Date(w.tanggal_awal);
        if (!isNaN(d.getTime()) && d < minDate) minDate = d;
      }
      if (w.tanggal_akhir) {
        const d = new Date(w.tanggal_akhir);
        if (!isNaN(d.getTime()) && d > maxDate) maxDate = d;
      }
    });

    if (maxReportedDayStr) {
      const d = new Date(maxReportedDayStr);
      if (!isNaN(d.getTime()) && d > maxDate) maxDate = d;
    }

    minDate.setHours(0,0,0,0);
    maxDate.setHours(0,0,0,0);

    const totalDays = Math.max(1, Math.floor((maxDate - minDate) / (1000 * 3600 * 24)) + 1);

    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];

    const tempChartData = [];
    let cumRealisasi = 0;

    for (let i = 0; i < totalDays; i++) {
      const currDate = new Date(minDate.getTime() + i * 24 * 3600 * 1000);
      const yyyymmdd = currDate.toISOString().split('T')[0];
      const shortDate = currDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const displayDate = currDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const dateSlash = formatDateSlash(yyyymmdd);

      let matchedWeek = sortedWeeks.find(w => {
        if (w.tanggal_awal && w.tanggal_akhir) {
          return yyyymmdd >= w.tanggal_awal && yyyymmdd <= w.tanggal_akhir;
        }
        return false;
      });

      let currentWeekNum = null;
      if (dailyRealisasiWeeks[yyyymmdd]) {
        currentWeekNum = parseInt(dailyRealisasiWeeks[yyyymmdd]);
        if (!matchedWeek && weekMap[currentWeekNum]) {
          matchedWeek = weekMap[currentWeekNum];
        }
      } else if (matchedWeek) {
        currentWeekNum = matchedWeek.minggu_ke;
      } else {
        const diffFromStart = Math.floor((currDate - pStart) / (1000 * 3600 * 24));
        currentWeekNum = diffFromStart >= 0 ? Math.floor(diffFromStart / 7) + 1 : 0;
        if (weekMap[currentWeekNum]) {
          matchedWeek = weekMap[currentWeekNum];
        }
      }

      const targetKumulatifMingguan = matchedWeek ? getSafeFloat(matchedWeek.target_kumulatif) : null;

      const actVal = getSafeFloat(dailyRealisasi[yyyymmdd]);
      const hasReportToday = dailyRealisasi[yyyymmdd] !== undefined;

      if (hasReportToday) {
        cumRealisasi += actVal;
      }

      const isFuture = yyyymmdd > todayStr && (!maxReportedDayStr || yyyymmdd > maxReportedDayStr);

      const deviasiVal = (hasReportToday && targetKumulatifMingguan !== null) 
        ? getSafeFloat(cumRealisasi - targetKumulatifMingguan)
        : null;

      tempChartData.push({
        hariKe: i + 1,
        label: `H-${(i + 1).toString().padStart(2, '0')}`,
        dateString: yyyymmdd,
        dateSlash: dateSlash,
        displayDate: displayDate,
        shortDate: shortDate,
        mingguKe: currentWeekNum,
        isFuture,
        targetKumulatifMingguan: targetKumulatifMingguan,
        rencanaKumulatif: targetKumulatifMingguan, 
        bobotRealisasi: actVal,
        realisasiKumulatif: isFuture && !hasReportToday ? null : getSafeFloat(cumRealisasi),
        deviasi: deviasiVal,
        hasReportToday
      });
    }

    setFullChartData(tempChartData);

    if (!startDateFilter && !endDateFilter && tempChartData.length > 0) {
      setStartDateFilter(tempChartData[0].dateString);
      setEndDateFilter(tempChartData[tempChartData.length - 1].dateString);
    }
  }, [scheduleData]);