<?php

namespace App\Controller;

use App\Entity\Exam;
use App\Form\ExamType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/dashboard/exams')]
#[IsGranted('ROLE_ADMIN')]
class ExamController extends AbstractController
{
    #[Route('', name: 'exam_index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): Response
    {
        return $this->render('exam/index.html.twig', [
            'exams' => $entityManager->getRepository(Exam::class)->findBy([], ['startDate' => 'ASC']),
        ]);
    }

    #[Route('/new', name: 'exam_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $exam = new Exam();
        $form = $this->createForm(ExamType::class, $exam);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($exam);
            $entityManager->flush();

            $this->addFlash('success', 'Exam scheduled successfully.');

            return $this->redirectToRoute('exam_index');
        }

        return $this->render('exam/form.html.twig', [
            'form' => $form->createView(),
            'exam' => $exam,
            'isEdit' => false,
        ]);
    }

    #[Route('/{id}/edit', name: 'exam_edit', methods: ['GET', 'POST'])]
    public function edit(Exam $exam, Request $request, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(ExamType::class, $exam);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            $this->addFlash('success', 'Exam updated successfully.');

            return $this->redirectToRoute('exam_index');
        }

        return $this->render('exam/form.html.twig', [
            'form' => $form->createView(),
            'exam' => $exam,
            'isEdit' => true,
        ]);
    }

    #[Route('/{id}/delete', name: 'exam_delete', methods: ['POST'])]
    public function delete(Exam $exam, Request $request, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete_exam_' . $exam->getId(), (string) $request->request->get('_token'))) {
            $entityManager->remove($exam);
            $entityManager->flush();
            $this->addFlash('success', 'Exam deleted successfully.');
        }

        return $this->redirectToRoute('exam_index');
    }
}
