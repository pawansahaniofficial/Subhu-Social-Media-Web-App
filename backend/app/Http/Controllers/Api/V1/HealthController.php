<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            DB::select('select 1');
            $db = ['status' => 'ok', 'driver' => DB::connection()->getDriverName()];
        } catch (Throwable $e) {
            report($e);
            $db = ['status' => 'down']; // no error details exposed
        }

        $ok = $db['status'] === 'ok';

        return response()->json(['status' => $ok ? 'ok' : 'degraded', 'database' => $db], $ok ? 200 : 503);
    }
}
