<?php

namespace App\Form;

use App\Entity\Announcement;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class AnnouncementType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('title', TextType::class)
            ->add('content', TextareaType::class, [
                'attr' => ['rows' => 6],
            ])
            ->add('targetAudience', ChoiceType::class, [
                'label' => 'Target audience',
                'choices' => [
                    'All' => 'All',
                    'Students' => 'Students',
                    'Staff' => 'Staff',
                    'Teachers' => 'Teachers',
                ],
            ])
            ->add('priority', ChoiceType::class, [
                'choices' => [
                    Announcement::PRIORITY_LOW => Announcement::PRIORITY_LOW,
                    Announcement::PRIORITY_NORMAL => Announcement::PRIORITY_NORMAL,
                    Announcement::PRIORITY_MEDIUM => Announcement::PRIORITY_MEDIUM,
                    Announcement::PRIORITY_HIGH => Announcement::PRIORITY_HIGH,
                ],
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Announcement::class,
        ]);
    }
}
