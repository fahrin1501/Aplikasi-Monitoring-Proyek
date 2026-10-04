<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CompanyProfile;
use App\Models\Service;
use App\Models\Event;
use Illuminate\Support\Facades\Storage;

class CompanyProfileController extends Controller
{
    public function getPublicData()
    {
        $profile = CompanyProfile::firstOrCreate(['id' => 1]);
        $services = Service::all();
        $events = Event::where('status', 'Diterbitkan')->orderBy('date', 'desc')->take(5)->get();

        return response()->json([
            'profile' => $profile,
            'services' => $services,
            'events' => $events
        ]);
    }

    public function updateLandingPage(Request $request)
    {
        $profile = CompanyProfile::firstOrCreate(['id' => 1]);
        $data = $request->only(['hero_title', 'hero_subtitle', 'btn_text']);

        if ($request->hasFile('hero_image')) {
            // Hapus gambar lama jika ada
            if ($profile->hero_image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($profile->hero_image);
            }
            $data['hero_image'] = $request->file('hero_image')->store('company_profile/hero', 'public');
        }

        $profile->update($data);
        return response()->json(['message' => 'Landing Page berhasil diperbarui', 'data' => $profile]);
    }

    public function updateContact(Request $request)
    {
        $profile = CompanyProfile::firstOrCreate(['id' => 1]);
        $profile->update($request->only(['email', 'phone', 'website', 'address']));
        return response()->json(['message' => 'Kontak diperbarui', 'data' => $profile]);
    }

    // ==========================================
    // CRUD LAYANAN (DENGAN UPLOAD GAMBAR)
    // ==========================================
    public function getServices() {
        return response()->json(Service::all());
    }

    public function storeService(Request $request) {
        $data = $request->except('image');

        // Cek jika ada file gambar yang diunggah
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('company_profile/services', 'public');
            $data['image'] = $path;
        }

        $service = Service::create($data);
        return response()->json(['message' => 'Layanan ditambahkan', 'data' => $service]);
    }

    public function destroyService($id) {
        $service = Service::findOrFail($id);
        // Hapus file fisik jika ada
        if ($service->image) {
            Storage::disk('public')->delete($service->image);
        }
        $service->delete();
        return response()->json(['message' => 'Layanan dihapus']);
    }

    // ==========================================
    // CRUD EVENT (DENGAN UPLOAD GAMBAR)
    // ==========================================
    public function getEvents() {
        return response()->json(Event::orderBy('date', 'desc')->get());
    }

    public function storeEvent(Request $request) {
        $data = $request->except('image');

        // Cek jika ada file gambar yang diunggah
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('company_profile/events', 'public');
            $data['image'] = $path;
        }

        $event = Event::create($data);
        return response()->json(['message' => 'Event ditambahkan', 'data' => $event]);
    }

    public function destroyEvent($id) {
        $event = Event::findOrFail($id);
        // Hapus file fisik jika ada
        if ($event->image) {
            Storage::disk('public')->delete($event->image);
        }
        $event->delete();
        return response()->json(['message' => 'Event dihapus']);
    }
}
