<?php

namespace App\Controller;

use App\Entity\StaffMember;
use App\Form\StaffMemberType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/dashboard/staff')]
#[IsGranted('ROLE_ADMIN')]
class StaffController extends AbstractController
{
    #[Route('', name: 'staff_index', methods: ['GET'])]
    public function index(Request $request, EntityManagerInterface $entityManager): Response
    {
        $query = trim((string) $request->query->get('q', ''));
        $repository = $entityManager->getRepository(StaffMember::class);

        if ($query !== '') {
            $staffMembers = $repository->createQueryBuilder('staff')
                ->where('LOWER(staff.fullName) LIKE :query')
                ->orWhere('LOWER(staff.email) LIKE :query')
                ->orWhere('LOWER(staff.position) LIKE :query')
                ->setParameter('query', '%' . mb_strtolower($query) . '%')
                ->orderBy('staff.fullName', 'ASC')
                ->getQuery()
                ->getResult();
        } else {
            $staffMembers = $repository->findBy([], ['fullName' => 'ASC']);
        }

        return $this->render('staff/index.html.twig', [
            'staffMembers' => $staffMembers,
            'query' => $query,
        ]);
    }

    #[Route('/new', name: 'staff_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $staffMember = new StaffMember();
        $form = $this->createForm(StaffMemberType::class, $staffMember);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($staffMember);
            $entityManager->flush();

            $this->addFlash('success', 'Staff member added successfully.');

            return $this->redirectToRoute('staff_index');
        }

        return $this->render('staff/form.html.twig', [
            'form' => $form->createView(),
            'staffMember' => $staffMember,
            'isEdit' => false,
        ]);
    }

    #[Route('/{id}/edit', name: 'staff_edit', methods: ['GET', 'POST'])]
    public function edit(StaffMember $staffMember, Request $request, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(StaffMemberType::class, $staffMember);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            $this->addFlash('success', 'Staff member updated successfully.');

            return $this->redirectToRoute('staff_index');
        }

        return $this->render('staff/form.html.twig', [
            'form' => $form->createView(),
            'staffMember' => $staffMember,
            'isEdit' => true,
        ]);
    }

    #[Route('/{id}/delete', name: 'staff_delete', methods: ['POST'])]
    public function delete(StaffMember $staffMember, Request $request, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete_staff_' . $staffMember->getId(), (string) $request->request->get('_token'))) {
            $entityManager->remove($staffMember);
            $entityManager->flush();
            $this->addFlash('success', 'Staff member deleted successfully.');
        }

        return $this->redirectToRoute('staff_index');
    }
}
