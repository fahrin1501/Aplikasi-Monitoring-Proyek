<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectDetailController;
use App\Http\Controllers\RabController;
use App\Http\Controllers\ProjectGisController;
use App\Http\Controllers\DailyReportController;
use App\Http\Controllers\ProjectScheduleController;
use App\Http\Controllers\CompanyProfileController;

Route::get('/test-koneksi', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Halo dari Laravel! Koneksi React dan Laravel berhasil 🚀',
        'data' => ['total_proyek' => 12, 'proyek_aktif' => 5]
    ]);
});

Route::post('/login', [AuthController::class, 'login']);
Route::get('/company-profile', [CompanyProfileController::class, 'show']);

Route::get('/reset-password/{token}', function (Request $request, $token) {
    $frontendUrl = 'http://localhost:5173/reset-password';
    return redirect($frontendUrl . '?token=' . $token . '&email=' . $request->email);
})->name('password.reset');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/users', [AuthController::class, 'index']);
    Route::put('/users/{id}', [AuthController::class, 'update']);
    Route::put('/users/{id}/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::get('/user', function (Request $request) { return $request->user(); });

    Route::post('/company-profile', [CompanyProfileController::class, 'update']);

    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);

    Route::post('/projects/{projectId}/personnels', [ProjectDetailController::class, 'storePersonnel']);
    Route::put('/personnels/{id}', [ProjectDetailController::class, 'updatePersonnel']);
    Route::delete('/personnels/{id}', [ProjectDetailController::class, 'destroyPersonnel']);
    Route::post('/projects/{projectId}/documents', [ProjectDetailController::class, 'storeDocument']);
    Route::delete('/documents/{id}', [ProjectDetailController::class, 'destroyDocument']);

    Route::get('/projects/{projectId}/rabs', [RabController::class, 'index']);
    Route::post('/projects/{projectId}/rabs/categories', [RabController::class, 'storeCategory']);
    Route::put('/rabs/categories/{id}', [RabController::class, 'updateCategory']);
    Route::delete('/rabs/categories/{id}', [RabController::class, 'destroyCategory']);
    Route::post('/rabs/categories/{categoryId}/items', [RabController::class, 'storeItem']);
    Route::put('/rab-items/{id}', [RabController::class, 'updateItem']);
    Route::delete('/rab-items/{id}', [RabController::class, 'destroyItem']);

    Route::get('/projects/{projectId}/gis', [ProjectGisController::class, 'index']);
    Route::post('/projects/{projectId}/gis', [ProjectGisController::class, 'store']);
    Route::put('/projects/{projectId}/gis/{id}', [ProjectGisController::class, 'update']);
    Route::delete('/projects/{projectId}/gis/{id}', [ProjectGisController::class, 'destroy']);
    Route::post('/projects/{projectId}/gis-documents', [ProjectGisController::class, 'storeDocument']);
    Route::delete('/gis-documents/{id}', [ProjectGisController::class, 'destroyDocument']);

    Route::get('/daily-reports', [DailyReportController::class, 'index']);
    Route::post('/projects/{projectId}/daily-reports', [DailyReportController::class, 'store']);
    Route::get('/projects/{projectId}/daily-reports', [DailyReportController::class, 'getByProject']);
    Route::get('/daily-reports/{id}', [DailyReportController::class, 'show']);
    Route::put('/daily-reports/{id}', [DailyReportController::class, 'update']);
    Route::delete('/daily-reports/{id}', [DailyReportController::class, 'destroy']);

    // --- ROUTE BARU UNTUK INLINE EDIT MATRIKS S-CURVE ---
    Route::put('/daily-report-activities/{id}', [DailyReportController::class, 'quickUpdateActivity']);

    Route::get('/daily-reports/{id}/export/pdf', [DailyReportController::class, 'exportPdf']);
    Route::get('/daily-reports/{id}/export/excel', [DailyReportController::class, 'exportExcel']);
    Route::post('/daily-reports/{id}/attachments', [DailyReportController::class, 'uploadAttachment']);
    Route::delete('/daily-report-attachments/{id}', [DailyReportController::class, 'destroyAttachment']);
    Route::put('/daily-reports/{id}/verify', [DailyReportController::class, 'verifyReport']);
    Route::put('/daily-reports/{id}/reject', [DailyReportController::class, 'rejectReport']);

    Route::get('/projects/{projectId}/schedules', [ProjectScheduleController::class, 'getSchedules']);
    Route::post('/projects/{projectId}/schedules', [ProjectScheduleController::class, 'saveSchedules']);
    Route::delete('/projects/{projectId}/schedules', [ProjectScheduleController::class, 'destroySchedules']);

    Route::get('/projects/{id}/export/pdf', [ProjectController::class, 'exportPdf']);
    Route::get('/projects/{id}/export/excel', [ProjectController::class, 'exportExcel']);
    Route::get('/projects/{id}/export-rab/pdf', [RabController::class, 'exportRabPdf']);
    Route::get('/projects/{id}/export-rab/excel', [RabController::class, 'exportRabExcel']);
    Route::post('/projects/{projectId}/export-kurva/pdf', [ProjectScheduleController::class, 'exportKurvaPdf']);
    Route::post('/projects/{projectId}/export-kurva/excel', [ProjectScheduleController::class, 'exportKurvaExcel']);

    Route::post('/projects/import', [ProjectController::class, 'import']);
    Route::post('/projects/{id}/import-rab', [RabController::class, 'importRAB']);
    Route::get('/projects-active-report', [ProjectController::class, 'getActiveForReport']);

    Route::post('/register', [AuthController::class, 'register']);
});
