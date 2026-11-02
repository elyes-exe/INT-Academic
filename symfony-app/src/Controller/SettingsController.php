<?php

namespace App\Controller;

use App\Entity\InstitutionSetting;
use App\Form\InstitutionSettingType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/dashboard/settings')]
#[IsGranted('ROLE_ADMIN')]
class SettingsController extends AbstractController
{
    #[Route('', name: 'settings_index', methods: ['GET', 'POST'])]
    public function index(Request $request, EntityManagerInterface $entityManager): Response
    {
        $settings = $entityManager->getRepository(InstitutionSetting::class)->findOneBy([]) ?? new InstitutionSetting();

        $form = $this->createForm(InstitutionSettingType::class, $settings);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $settings->setUpdatedAt(new \DateTimeImmutable());

            if ($settings->getId() === null) {
                $entityManager->persist($settings);
            }

            $entityManager->flush();

            $this->addFlash('success', 'Settings saved successfully.');

            return $this->redirectToRoute('settings_index');
        }

        return $this->render('settings/index.html.twig', [
            'form' => $form->createView(),
            'settings' => $settings,
        ]);
    }
}
