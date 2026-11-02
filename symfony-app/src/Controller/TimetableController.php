<?php

namespace App\Controller;

use App\Entity\TimetableEntry;
use App\Form\TimetableEntryType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/dashboard/timetable')]
#[IsGranted('ROLE_ADMIN')]
class TimetableController extends AbstractController
{
    private const DAY_ORDER = [
        'Monday' => 1,
        'Tuesday' => 2,
        'Wednesday' => 3,
        'Thursday' => 4,
        'Friday' => 5,
    ];

    #[Route('', name: 'timetable_index', methods: ['GET'])]
    public function index(Request $request, EntityManagerInterface $entityManager): Response
    {
        $entries = $entityManager->getRepository(TimetableEntry::class)->findBy([], ['className' => 'ASC', 'startTime' => 'ASC']);

        $classNames = array_values(array_unique(array_map(
            static fn (TimetableEntry $entry): string => $entry->getClassName(),
            $entries,
        )));
        sort($classNames);

        $selectedClass = trim((string) $request->query->get('class', $classNames[0] ?? ''));
        if ($selectedClass !== '' && !in_array($selectedClass, $classNames, true)) {
            $selectedClass = $classNames[0] ?? '';
        }

        $selectedEntries = array_values(array_filter(
            $entries,
            static fn (TimetableEntry $entry): bool => $selectedClass === '' || $entry->getClassName() === $selectedClass,
        ));

        usort($selectedEntries, function (TimetableEntry $left, TimetableEntry $right): int {
            $startComparison = ($left->getStartTime()?->format('H:i') ?? '') <=> ($right->getStartTime()?->format('H:i') ?? '');
            if ($startComparison !== 0) {
                return $startComparison;
            }

            return (self::DAY_ORDER[$left->getDayOfWeek()] ?? 99) <=> (self::DAY_ORDER[$right->getDayOfWeek()] ?? 99);
        });

        $grid = [];
        $timeSlots = [];

        foreach ($selectedEntries as $entry) {
            $slot = $entry->getTimeRange();
            $timeSlots[$slot] = $slot;
            $grid[$entry->getDayOfWeek()][$slot] = $entry;
        }

        uasort($timeSlots, static fn (string $left, string $right): int => strcmp($left, $right));

        return $this->render('timetable/index.html.twig', [
            'entries' => $selectedEntries,
            'classNames' => $classNames,
            'selectedClass' => $selectedClass,
            'days' => array_keys(self::DAY_ORDER),
            'grid' => $grid,
            'timeSlots' => array_values($timeSlots),
        ]);
    }

    #[Route('/new', name: 'timetable_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $entry = new TimetableEntry();
        $form = $this->createForm(TimetableEntryType::class, $entry);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($entry);
            $entityManager->flush();

            $this->addFlash('success', 'Timetable entry added successfully.');

            return $this->redirectToRoute('timetable_index', ['class' => $entry->getClassName()]);
        }

        return $this->render('timetable/form.html.twig', [
            'form' => $form->createView(),
            'entry' => $entry,
            'isEdit' => false,
        ]);
    }

    #[Route('/{id}/edit', name: 'timetable_edit', methods: ['GET', 'POST'])]
    public function edit(TimetableEntry $entry, Request $request, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(TimetableEntryType::class, $entry);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            $this->addFlash('success', 'Timetable entry updated successfully.');

            return $this->redirectToRoute('timetable_index', ['class' => $entry->getClassName()]);
        }

        return $this->render('timetable/form.html.twig', [
            'form' => $form->createView(),
            'entry' => $entry,
            'isEdit' => true,
        ]);
    }

    #[Route('/{id}/delete', name: 'timetable_delete', methods: ['POST'])]
    public function delete(TimetableEntry $entry, Request $request, EntityManagerInterface $entityManager): Response
    {
        $className = $entry->getClassName();

        if ($this->isCsrfTokenValid('delete_timetable_' . $entry->getId(), (string) $request->request->get('_token'))) {
            $entityManager->remove($entry);
            $entityManager->flush();
            $this->addFlash('success', 'Timetable entry deleted successfully.');
        }

        return $this->redirectToRoute('timetable_index', ['class' => $className]);
    }
}
