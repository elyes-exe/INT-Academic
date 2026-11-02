<?php

namespace App\Form;

use App\Entity\Exam;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\DateType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class ExamType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', TextType::class)
            ->add('className', TextType::class, [
                'label' => 'Class',
            ])
            ->add('classroomName', TextType::class, [
                'label' => 'Classroom',
                'required' => false,
            ])
            ->add('startDate', DateType::class, [
                'label' => 'Start date',
                'widget' => 'single_text',
                'input' => 'datetime_immutable',
            ])
            ->add('endDate', DateType::class, [
                'label' => 'End date',
                'widget' => 'single_text',
                'input' => 'datetime_immutable',
            ])
            ->add('status', ChoiceType::class, [
                'choices' => [
                    Exam::STATUS_PLANNED => Exam::STATUS_PLANNED,
                    Exam::STATUS_SCHEDULED => Exam::STATUS_SCHEDULED,
                    Exam::STATUS_COMPLETED => Exam::STATUS_COMPLETED,
                ],
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Exam::class,
        ]);
    }
}
