<?php

namespace Database\Seeders;

use App\Models\Panitia;
use Illuminate\Database\Seeder;

class PanitiaSeeder extends Seeder
{
    public function run(): void
    {
        $subjects = [
            'Bahasa Melayu',
            'Bahasa Inggeris',
            'Mathematics',
            'Science',
            'History',
            'Islamic Education',
            'ICT',
        ];

        foreach ($subjects as $name) {
            Panitia::updateOrCreate(['name' => $name], ['status' => 'active']);
        }
    }
}
