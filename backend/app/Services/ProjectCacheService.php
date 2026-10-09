<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class ProjectCacheService
{
    // Durasi cache default: 24 jam (akan di-flush jika ada update)
    const TTL = 86400;

    public static function getScheduleCacheKey($projectId)
    {
        return "project_schedule_data_{$projectId}";
    }

    public static function getProjectDetailCacheKey($projectId)
    {
        return "project_detail_data_{$projectId}";
    }

    /**
     * Ambil data dari cache, jika tidak ada baru jalankan query
     */
    public static function rememberSchedule($projectId, \Closure $callback)
    {
        return Cache::remember(self::getScheduleCacheKey($projectId), self::TTL, $callback);
    }

    public static function rememberProjectDetail($projectId, \Closure $callback)
    {
        return Cache::remember(self::getProjectDetailCacheKey($projectId), self::TTL, $callback);
    }

    /**
     * Hapus cache otomatis saat ada perubahan data
     */
    public static function clearProjectCache($projectId)
    {
        Cache::forget(self::getScheduleCacheKey($projectId));
        Cache::forget(self::getProjectDetailCacheKey($projectId));
    }
}
