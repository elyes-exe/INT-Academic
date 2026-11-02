<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
#[UniqueEntity(fields: ['name'], message: 'This classroom already exists.')]
class Classroom
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 120, unique: true)]
    #[Assert\NotBlank]
    private string $name = '';

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    private string $floor = '';

    #[ORM\Column]
    #[Assert\Positive]
    private int $capacity = 1;

    #[ORM\Column]
    #[Assert\PositiveOrZero]
    private int $currentUsage = 0;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $location = null;

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

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = trim($name);

        return $this;
    }

    public function getFloor(): string
    {
        return $this->floor;
    }

    public function setFloor(string $floor): static
    {
        $this->floor = trim($floor);

        return $this;
    }

    public function getCapacity(): int
    {
        return $this->capacity;
    }

    public function setCapacity(int $capacity): static
    {
        $this->capacity = $capacity;

        return $this;
    }

    public function getCurrentUsage(): int
    {
        return $this->currentUsage;
    }

    public function setCurrentUsage(int $currentUsage): static
    {
        $this->currentUsage = $currentUsage;

        return $this;
    }

    public function getLocation(): ?string
    {
        return $this->location;
    }

    public function setLocation(?string $location): static
    {
        $this->location = $location !== null ? trim($location) : null;

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

    public function getOccupancyPercent(): int
    {
        if ($this->capacity <= 0) {
            return 0;
        }

        return (int) round(($this->currentUsage / $this->capacity) * 100);
    }
}
