<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CompanyProfile;
use App\Models\Service;
use App\Models\Event;

class CompanyProfileController extends Controller
{
    // ==========================================
    // 1. ENDPOINT PUBLIK (Untuk Website Utama)
    // ==========================================
    public function getPublicData()
    {
        // Ambil data pertama (atau buat kosong jika belum ada)
        $profile = CompanyProfile::firstOrCreate(['id' => 1]);
        $services = Service::all();
        $events = Event::where('status', 'Diterbitkan')->orderBy('date', 'desc')->take(5)->get();

        return response()->json([
            'profile' => $profile,
            'services' => $services,
            'events' => $events
        ]);
    }

    // ==========================================
    // 2. ENDPOINT ADMIN (Untuk Edit di Sidebar)
    // ==========================================

    // Simpan Pengaturan Landing Page
    public function updateLandingPage(Request $request)
    {
        $profile = CompanyProfile::firstOrCreate(['id' => 1]);
        $profile->update($request->only(['hero_title', 'hero_subtitle', 'btn_text']));
        return response()->json(['message' => 'Landing Page berhasil diperbarui', 'data' => $profile]);
    }

    // Simpan Pengaturan Kontak
    public function updateContact(Request $request)
    {
        $profile = CompanyProfile::firstOrCreate(['id' => 1]);
        $profile->update($request->only(['email', 'phone', 'website', 'address']));
        return response()->json(['message' => 'Kontak berhasil diperbarui', 'data' => $profile]);
    }

    // ==========================================
    // 3. CRUD LAYANAN (SERVICES)
    // ==========================================
    public function getServices() { return response()->json(Service::all()); }

    public function storeService(Request $request) {
        $service = Service::create($request->all());
        return response()->json(['message' => 'Layanan ditambahkan', 'data' => $service]);
    }

    public function destroyService($id) {
        Service::destroy($id);
        return response()->json(['message' => 'Layanan dihapus']);
    }

    // ==========================================
    // 4. CRUD EVENT (BERITA)
    // ==========================================
    public function getEvents() { return response()->json(Event::orderBy('date', 'desc')->get()); }

    public function storeEvent(Request $request) {
        $event = Event::create($request->all());
        return response()->json(['message' => 'Event ditambahkan', 'data' => $event]);
    }

    public function destroyEvent($id) {
        Event::destroy($id);
        return response()->json(['message' => 'Event dihapus']);
    }
}
