<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
class TimetableEntry
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    private string $className = '';

    #[ORM\Column(length: 30)]
    #[Assert\NotBlank]
    private string $dayOfWeek = 'Monday';

    #[ORM\Column(type: Types::TIME_IMMUTABLE)]
    #[Assert\NotNull]
    private ?\DateTimeImmutable $startTime = null;

    #[ORM\Column(type: Types::TIME_IMMUTABLE)]
    #[Assert\NotNull]
    private ?\DateTimeImmutable $endTime = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private string $subject = '';

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private string $teacherName = '';

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    private string $classroomName = '';

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getClassName(): string
    {
        return $this->className;
    }

    public function setClassName(string $className): static
    {
        $this->className = trim($className);

        return $this;
    }

    public function getDayOfWeek(): string
    {
        return $this->dayOfWeek;
    }

    public function setDayOfWeek(string $dayOfWeek): static
    {
        $this->dayOfWeek = $dayOfWeek;

        return $this;
    }

    public function getStartTime(): ?\DateTimeImmutable
    {
        return $this->startTime;
    }

    public function setStartTime(?\DateTimeImmutable $startTime): static
    {
        $this->startTime = $startTime;

        return $this;
    }

    public function getEndTime(): ?\DateTimeImmutable
    {
        return $this->endTime;
    }

    public function setEndTime(?\DateTimeImmutable $endTime): static
    {
        $this->endTime = $endTime;

        return $this;
    }

    public function getSubject(): string
    {
        return $this->subject;
    }

    public function setSubject(string $subject): static
    {
        $this->subject = trim($subject);

        return $this;
    }

    public function getTeacherName(): string
    {
        return $this->teacherName;
    }

    public function setTeacherName(string $teacherName): static
    {
        $this->teacherName = trim($teacherName);

        return $this;
    }

    public function getClassroomName(): string
    {
        return $this->classroomName;
    }

    public function setClassroomName(string $classroomName): static
    {
        $this->classroomName = trim($classroomName);

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getTimeRange(): string
    {
        if (!$this->startTime || !$this->endTime) {
            return '';
        }

        return sprintf('%s - %s', $this->startTime->format('H:i'), $this->endTime->format('H:i'));
    }
}
