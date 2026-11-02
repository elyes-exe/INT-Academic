<?php

namespace App\Form;

use App\Entity\TimetableEntry;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\TimeType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class TimetableEntryType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('className', TextType::class, [
                'label' => 'Class',
            ])
            ->add('dayOfWeek', ChoiceType::class, [
                'label' => 'Day',
                'choices' => [
                    'Monday' => 'Monday',
                    'Tuesday' => 'Tuesday',
                    'Wednesday' => 'Wednesday',
                    'Thursday' => 'Thursday',
                    'Friday' => 'Friday',
                ],
            ])
            ->add('startTime', TimeType::class, [
                'label' => 'Start time',
                'widget' => 'single_text',
                'input' => 'datetime_immutable',
                'with_seconds' => false,
            ])
            ->add('endTime', TimeType::class, [
                'label' => 'End time',
                'widget' => 'single_text',
                'input' => 'datetime_immutable',
                'with_seconds' => false,
            ])
            ->add('subject', TextType::class)
            ->add('teacherName', TextType::class, [
                'label' => 'Teacher',
            ])
            ->add('classroomName', TextType::class, [
                'label' => 'Classroom',
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => TimetableEntry::class,
        ]);
    }
}
