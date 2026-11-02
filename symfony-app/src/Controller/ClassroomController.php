<?php

namespace App\Controller;

use App\Entity\Classroom;
use App\Form\ClassroomType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/dashboard/classrooms')]
#[IsGranted('ROLE_ADMIN')]
class ClassroomController extends AbstractController
{
    #[Route('', name: 'classroom_index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): Response
    {
        return $this->render('classroom/index.html.twig', [
            'classrooms' => $entityManager->getRepository(Classroom::class)->findBy([], ['name' => 'ASC']),
        ]);
    }

    #[Route('/new', name: 'classroom_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $classroom = new Classroom();
        $form = $this->createForm(ClassroomType::class, $classroom);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($classroom);
            $entityManager->flush();

            $this->addFlash('success', 'Classroom added successfully.');

            return $this->redirectToRoute('classroom_index');
        }

        return $this->render('classroom/form.html.twig', [
            'form' => $form->createView(),
            'classroom' => $classroom,
            'isEdit' => false,
        ]);
    }

    #[Route('/{id}/edit', name: 'classroom_edit', methods: ['GET', 'POST'])]
    public function edit(Classroom $classroom, Request $request, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(ClassroomType::class, $classroom);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            $this->addFlash('success', 'Classroom updated successfully.');

            return $this->redirectToRoute('classroom_index');
        }

        return $this->render('classroom/form.html.twig', [
            'form' => $form->createView(),
            'classroom' => $classroom,
            'isEdit' => true,
        ]);
    }

    #[Route('/{id}/delete', name: 'classroom_delete', methods: ['POST'])]
    public function delete(Classroom $classroom, Request $request, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete_classroom_' . $classroom->getId(), (string) $request->request->get('_token'))) {
            $entityManager->remove($classroom);
            $entityManager->flush();
            $this->addFlash('success', 'Classroom deleted successfully.');
        }

        return $this->redirectToRoute('classroom_index');
    }
}
