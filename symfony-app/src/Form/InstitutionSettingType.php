<?php

namespace App\Form;

use App\Entity\InstitutionSetting;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class InstitutionSettingType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('instituteName', TextType::class, [
                'label' => 'Institution name',
            ])
            ->add('email', EmailType::class)
            ->add('phone', TextType::class)
            ->add('address', TextType::class)
            ->add('notificationsEnabled', CheckboxType::class, [
                'label' => 'Enable dashboard notifications',
                'required' => false,
            ])
            ->add('emailAlertsEnabled', CheckboxType::class, [
                'label' => 'Enable email alerts',
                'required' => false,
            ])
            ->add('twoFactorEnabled', CheckboxType::class, [
                'label' => 'Enable two-factor authentication',
                'required' => false,
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => InstitutionSetting::class,
        ]);
    }
}
