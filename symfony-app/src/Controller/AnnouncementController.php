<?php

namespace App\Controller;

use App\Entity\Announcement;
use App\Form\AnnouncementType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/dashboard/announcements')]
#[IsGranted('ROLE_ADMIN')]
class AnnouncementController extends AbstractController
{
    #[Route('', name: 'announcement_index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): Response
    {
        return $this->render('announcement/index.html.twig', [
            'announcements' => $entityManager->getRepository(Announcement::class)->findBy([], ['publishedAt' => 'DESC']),
        ]);
    }

    #[Route('/new', name: 'announcement_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $announcement = new Announcement();
        $form = $this->createForm(AnnouncementType::class, $announcement);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $announcement->setPublishedAt(new \DateTimeImmutable());
            $entityManager->persist($announcement);
            $entityManager->flush();

            $this->addFlash('success', 'Announcement published successfully.');

            return $this->redirectToRoute('announcement_index');
        }

        return $this->render('announcement/form.html.twig', [
            'form' => $form->createView(),
            'announcement' => $announcement,
            'isEdit' => false,
        ]);
    }

    #[Route('/{id}/edit', name: 'announcement_edit', methods: ['GET', 'POST'])]
    public function edit(Announcement $announcement, Request $request, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(AnnouncementType::class, $announcement);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $announcement->setPublishedAt(new \DateTimeImmutable());
            $entityManager->flush();

            $this->addFlash('success', 'Announcement updated successfully.');

            return $this->redirectToRoute('announcement_index');
        }

        return $this->render('announcement/form.html.twig', [
            'form' => $form->createView(),
            'announcement' => $announcement,
            'isEdit' => true,
        ]);
    }

    #[Route('/{id}/delete', name: 'announcement_delete', methods: ['POST'])]
    public function delete(Announcement $announcement, Request $request, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete_announcement_' . $announcement->getId(), (string) $request->request->get('_token'))) {
            $entityManager->remove($announcement);
            $entityManager->flush();
            $this->addFlash('success', 'Announcement deleted successfully.');
        }

        return $this->redirectToRoute('announcement_index');
    }
}
