<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    public function index()
    {
        // Mengambil semua user, lalu mengecek apakah usianya kurang dari 3 hari
        $users = User::orderBy('created_at', 'desc')->get()->map(function ($user) {
            // Menambahkan indikator 'is_new' (true jika dibuat dalam 3 hari terakhir)
            $user->is_new = $user->created_at ? $user->created_at->diffInDays(now()) <= 3 : false;
            return $user;
        });

        return response()->json($users);
    }

    // Fungsi Update Akun (Fitur Edit)
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            // Pengecualian unique email untuk ID user ini sendiri agar bisa disimpan tanpa ganti email
            'email' => 'required|string|email|unique:users,email,' . $id,
            'role' => 'required|string',
            'status' => 'required|string'
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'status' => $validated['status']
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Data akun berhasil diperbarui',
            'user' => $user
        ]);
    }

    // Fungsi Register (Bisa dipakai saat tambah akun dari AccountList)
    public function register(Request $request)
    {
        // 1. Hapus 'role' dari validasi
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|string|min:6'
        ]);

        // 2. Buat user dengan role otomatis 'Tamu' (atau 'Owner / PPK')
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'Tamu', // <--- Role diatur otomatis oleh sistem
            'status' => 'Aktif'
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Akun berhasil dibuat',
            'user' => $user,
            'token' => $token
        ]);
    }

    // Fungsi Login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email atau Password salah'
            ], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        if ($user->status !== 'Aktif') {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun Anda dinonaktifkan. Hubungi Administrator.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil',
            'user' => $user,
            'token' => $token
        ]);
    }

    // Fungsi Reset Password
    public function resetPassword(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'password' => 'required|string|min:6'
        ]);

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Password berhasil disetel ulang'
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // Cek apakah email terdaftar
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'message' => 'Kami tidak dapat menemukan pengguna dengan alamat email tersebut.'
            ], 404);
        }

        // Generate Token Reset & Kirim Email (Bawaan Laravel)
        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'status' => 'success',
                'message' => 'Tautan untuk mereset kata sandi telah dikirim ke email Anda!'
            ]);
        }

        return response()->json([
            'message' => 'Gagal mengirim tautan reset. Silakan coba lagi.'
        ], 500);
    }

    // Fungsi Logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }
}
