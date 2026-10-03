<?php

namespace Tests\Concerns;

use App\Models\Panitia;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

trait CreatesSsdmsData
{
    protected function makePanitia(string $name, string $status = 'active'): Panitia
    {
        return Panitia::create(['name' => $name, 'status' => $status]);
    }

    protected function makeAdmin(array $overrides = []): User
    {
        return User::create(array_merge([
            'name' => 'Admin User',
            'username' => 'admin',
            'email' => 'admin@test.local',
            'password' => 'secret1234',
            'role' => 'Admin',
            'is_active' => true,
            'account_status' => 'Approved',
        ], $overrides));
    }

    /** @param Panitia[] $panitia first one becomes the primary Panitia */
    protected function makeTeacher(array $panitia = [], array $overrides = []): User
    {
        static $counter = 0;
        $counter++;

        $teacher = User::create(array_merge([
            'name' => "Teacher {$counter}",
            'username' => "teacher{$counter}",
            'email' => "teacher{$counter}@test.local",
            'password' => 'secret1234',
            'role' => 'Teacher',
            'is_active' => true,
            'account_status' => 'Approved',
        ], $overrides));

        foreach ($panitia as $i => $p) {
            $teacher->panitia()->attach($p->id, ['is_primary' => $i === 0]);
        }

        return $teacher;
    }

    protected function actingAsUser(User $user, ?Panitia $panitia = null): static
    {
        Sanctum::actingAs($user);

        return $panitia
            ? $this->withHeader('X-Active-Panitia', (string) $panitia->id)
            : $this;
    }
}
