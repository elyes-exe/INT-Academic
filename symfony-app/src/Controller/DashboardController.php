<?php

namespace App\Controller;

use App\Entity\Announcement;
use App\Entity\Classroom;
use App\Entity\Exam;
use App\Entity\StaffMember;
use App\Entity\Student;
use App\Entity\TimetableEntry;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class DashboardController extends AbstractController
{
    #[Route('/dashboard', name: 'dashboard_index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): Response
    {
        return $this->render('dashboard/index.html.twig', [
            'studentCount' => $entityManager->getRepository(Student::class)->count([]),
            'staffCount' => $entityManager->getRepository(StaffMember::class)->count([]),
            'announcementCount' => $entityManager->getRepository(Announcement::class)->count([]),
            'classroomCount' => $entityManager->getRepository(Classroom::class)->count([]),
            'examCount' => $entityManager->getRepository(Exam::class)->count([]),
            'timetableCount' => $entityManager->getRepository(TimetableEntry::class)->count([]),
            'latestAnnouncements' => $entityManager->getRepository(Announcement::class)->findBy([], ['publishedAt' => 'DESC'], 5),
            'upcomingExams' => $entityManager->getRepository(Exam::class)->findBy([], ['startDate' => 'ASC'], 5),
        ]);
    }
}
