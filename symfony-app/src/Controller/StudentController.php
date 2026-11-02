<?php

namespace App\Controller;

use App\Entity\Student;
use App\Form\StudentType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/dashboard/students')]
#[IsGranted('ROLE_ADMIN')]
class StudentController extends AbstractController
{
    #[Route('', name: 'student_index', methods: ['GET'])]
    public function index(Request $request, EntityManagerInterface $entityManager): Response
    {
        $query = trim((string) $request->query->get('q', ''));
        $repository = $entityManager->getRepository(Student::class);

        if ($query !== '') {
            $students = $repository->createQueryBuilder('student')
                ->where('LOWER(student.fullName) LIKE :query')
                ->orWhere('LOWER(student.email) LIKE :query')
                ->orWhere('LOWER(student.className) LIKE :query')
                ->setParameter('query', '%' . mb_strtolower($query) . '%')
                ->orderBy('student.fullName', 'ASC')
                ->getQuery()
                ->getResult();
        } else {
            $students = $repository->findBy([], ['fullName' => 'ASC']);
        }

        return $this->render('student/index.html.twig', [
            'students' => $students,
            'query' => $query,
        ]);
    }

    #[Route('/new', name: 'student_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $student = new Student();
        $form = $this->createForm(StudentType::class, $student);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($student);
            $entityManager->flush();

            $this->addFlash('success', 'Student added successfully.');

            return $this->redirectToRoute('student_index');
        }

        return $this->render('student/form.html.twig', [
            'form' => $form->createView(),
            'student' => $student,
            'isEdit' => false,
        ]);
    }

    #[Route('/{id}/edit', name: 'student_edit', methods: ['GET', 'POST'])]
    public function edit(Student $student, Request $request, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(StudentType::class, $student);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            $this->addFlash('success', 'Student updated successfully.');

            return $this->redirectToRoute('student_index');
        }

        return $this->render('student/form.html.twig', [
            'form' => $form->createView(),
            'student' => $student,
            'isEdit' => true,
        ]);
    }

    #[Route('/{id}/delete', name: 'student_delete', methods: ['POST'])]
    public function delete(Student $student, Request $request, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete_student_' . $student->getId(), (string) $request->request->get('_token'))) {
            $entityManager->remove($student);
            $entityManager->flush();
            $this->addFlash('success', 'Student deleted successfully.');
        }

        return $this->redirectToRoute('student_index');
    }
}
