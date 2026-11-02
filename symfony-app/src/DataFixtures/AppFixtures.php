<?php

namespace App\DataFixtures;

use App\Entity\Announcement;
use App\Entity\Classroom;
use App\Entity\Exam;
use App\Entity\InstitutionSetting;
use App\Entity\StaffMember;
use App\Entity\Student;
use App\Entity\TimetableEntry;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        $admin = (new User())
            ->setFullName('INT Administrator')
            ->setEmail('admin@int.edu')
            ->setRoles(['ROLE_ADMIN'])
            ->setSecretCodeHash(password_hash('INT2024', PASSWORD_BCRYPT));
        $admin->setPassword($this->passwordHasher->hashPassword($admin, 'admin123'));
        $manager->persist($admin);

        $settings = (new InstitutionSetting())
            ->setInstituteName('INT App')
            ->setEmail('contact@int.tn')
            ->setPhone('+216 71 000 000')
            ->setAddress('Institut National de Tunis, Avenue de la Technologie, Tunis')
            ->setNotificationsEnabled(true)
            ->setEmailAlertsEnabled(true)
            ->setTwoFactorEnabled(true);
        $manager->persist($settings);

        $students = [
            ['S-1001', 'Yassine Bakir', 'yassine.bakir@int.edu', 'BTS-IG-1', '2024-09-15'],
            ['S-1002', 'Mouhib Gmati', 'mouhib.gmati@int.edu', 'BTS-IG-1', '2024-09-15'],
            ['S-1003', 'Amira Trabelsi', 'amira.trabelsi@int.edu', 'BTS-IG-2', '2024-09-15'],
            ['S-1004', 'Mariem Ben Amor', 'mariem.benamor@int.edu', 'BTP-CM-1', '2024-09-15'],
            ['S-1005', 'Ahmed Heni', 'ahmed.heni@int.edu', 'BTP-AV-1', '2024-09-15'],
        ];

        foreach ($students as [$registrationNumber, $fullName, $email, $className, $enrollmentDate]) {
            $manager->persist(
                (new Student())
                    ->setRegistrationNumber($registrationNumber)
                    ->setFullName($fullName)
                    ->setEmail($email)
                    ->setClassName($className)
                    ->setEnrollmentDate(new \DateTimeImmutable($enrollmentDate)),
            );
        }

        $staffMembers = [
            ['Nadia Ben Salah', 'nadia.bensalah@int.edu', 'Systems Analysis', 'Informatics', '2022-09-01'],
            ['Sami Kacem', 'sami.kacem@int.edu', 'Database Engineering', 'Informatics', '2021-09-01'],
            ['Ons Miled', 'ons.miled@int.edu', 'Digital Communication', 'Media', '2023-01-10'],
            ['Walid Jerbi', 'walid.jerbi@int.edu', 'Academic Affairs Manager', 'Administration', '2020-06-15'],
        ];

        foreach ($staffMembers as [$fullName, $email, $position, $department, $joinDate]) {
            $manager->persist(
                (new StaffMember())
                    ->setFullName($fullName)
                    ->setEmail($email)
                    ->setPosition($position)
                    ->setDepartment($department)
                    ->setJoinDate(new \DateTimeImmutable($joinDate)),
            );
        }

        $classrooms = [
            ['Lab A1', 'Ground floor', 30, 24, 'Block A - Informatics laboratory'],
            ['Room B204', '2nd floor', 35, 29, 'Block B - Theory classroom'],
            ['Studio C3', '3rd floor', 20, 16, 'Media production studio'],
            ['Amphi INT', '1st floor', 120, 88, 'Main amphitheater'],
        ];

        foreach ($classrooms as [$name, $floor, $capacity, $currentUsage, $location]) {
            $manager->persist(
                (new Classroom())
                    ->setName($name)
                    ->setFloor($floor)
                    ->setCapacity($capacity)
                    ->setCurrentUsage($currentUsage)
                    ->setLocation($location),
            );
        }

        $announcements = [
            ['Semestre 2 planning update', 'The updated semester planning is now available for BTS Informatique de Gestion classes.', 'Students', Announcement::PRIORITY_HIGH, '-2 days'],
            ['Salle maintenance', 'Studio C3 will be unavailable tomorrow morning due to equipment maintenance.', 'Staff', Announcement::PRIORITY_MEDIUM, '-1 day'],
            ['Conseil scientifique', 'A scientific council meeting is scheduled for Friday at 14:00 in the main conference room.', 'All', Announcement::PRIORITY_NORMAL, '-4 hours'],
        ];

        foreach ($announcements as [$title, $content, $target, $priority, $publishedAt]) {
            $manager->persist(
                (new Announcement())
                    ->setTitle($title)
                    ->setContent($content)
                    ->setTargetAudience($target)
                    ->setPriority($priority)
                    ->setPublishedAt(new \DateTimeImmutable($publishedAt)),
            );
        }

        $exams = [
            ['Algorithmique Midterm', 'BTS-IG-1', 'Room B204', '2026-05-12', '2026-05-12', Exam::STATUS_SCHEDULED],
            ['Bases de Donnees Evaluation', 'BTS-IG-2', 'Lab A1', '2026-05-15', '2026-05-15', Exam::STATUS_PLANNED],
            ['Communication Multimedia Jury', 'BTP-CM-1', 'Studio C3', '2026-05-20', '2026-05-20', Exam::STATUS_PLANNED],
        ];

        foreach ($exams as [$name, $className, $classroomName, $startDate, $endDate, $status]) {
            $manager->persist(
                (new Exam())
                    ->setName($name)
                    ->setClassName($className)
                    ->setClassroomName($classroomName)
                    ->setStartDate(new \DateTimeImmutable($startDate))
                    ->setEndDate(new \DateTimeImmutable($endDate))
                    ->setStatus($status),
            );
        }

        $timetableEntries = [
            ['BTS-IG-1', 'Monday', '09:00', '10:00', 'Algorithmique', 'Nadia Ben Salah', 'Room B204'],
            ['BTS-IG-1', 'Monday', '10:00', '11:00', 'Base de Donnees', 'Sami Kacem', 'Lab A1'],
            ['BTS-IG-1', 'Wednesday', '11:00', '12:00', 'Architecture Web', 'Walid Jerbi', 'Lab A1'],
            ['BTS-IG-2', 'Tuesday', '09:00', '10:00', 'Conception UML', 'Nadia Ben Salah', 'Room B204'],
            ['BTS-IG-2', 'Thursday', '13:00', '14:00', 'SQL Avance', 'Sami Kacem', 'Lab A1'],
            ['BTP-CM-1', 'Friday', '14:00', '15:00', 'Design Graphique', 'Ons Miled', 'Studio C3'],
        ];

        foreach ($timetableEntries as [$className, $day, $start, $end, $subject, $teacherName, $classroomName]) {
            $manager->persist(
                (new TimetableEntry())
                    ->setClassName($className)
                    ->setDayOfWeek($day)
                    ->setStartTime(new \DateTimeImmutable($start))
                    ->setEndTime(new \DateTimeImmutable($end))
                    ->setSubject($subject)
                    ->setTeacherName($teacherName)
                    ->setClassroomName($classroomName),
            );
        }

        $manager->flush();
    }
}
