<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260416195442 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE announcement (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(255) NOT NULL, content LONGTEXT NOT NULL, target_audience VARCHAR(80) NOT NULL, priority VARCHAR(30) NOT NULL, published_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE classroom (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(120) NOT NULL, floor VARCHAR(120) NOT NULL, capacity INT NOT NULL, current_usage INT NOT NULL, location VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_497D309D5E237E06 (name), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE exam (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, class_name VARCHAR(120) NOT NULL, classroom_name VARCHAR(120) DEFAULT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, status VARCHAR(40) NOT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE institution_setting (id INT AUTO_INCREMENT NOT NULL, institute_name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(120) NOT NULL, address VARCHAR(255) NOT NULL, notifications_enabled TINYINT NOT NULL, email_alerts_enabled TINYINT NOT NULL, two_factor_enabled TINYINT NOT NULL, updated_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE staff_member (id INT AUTO_INCREMENT NOT NULL, full_name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, position VARCHAR(255) NOT NULL, department VARCHAR(255) NOT NULL, join_date DATE NOT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_759948C3E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE student (id INT AUTO_INCREMENT NOT NULL, full_name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, class_name VARCHAR(120) NOT NULL, registration_number VARCHAR(80) DEFAULT NULL, enrollment_date DATE NOT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_B723AF33E7927C74 (email), UNIQUE INDEX UNIQ_B723AF3338CEDFBE (registration_number), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE timetable_entry (id INT AUTO_INCREMENT NOT NULL, class_name VARCHAR(120) NOT NULL, day_of_week VARCHAR(30) NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, subject VARCHAR(255) NOT NULL, teacher_name VARCHAR(255) NOT NULL, classroom_name VARCHAR(120) NOT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE `user` (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, secret_code_hash VARCHAR(255) NOT NULL, full_name VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_8D93D649E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE announcement');
        $this->addSql('DROP TABLE classroom');
        $this->addSql('DROP TABLE exam');
        $this->addSql('DROP TABLE institution_setting');
        $this->addSql('DROP TABLE staff_member');
        $this->addSql('DROP TABLE student');
        $this->addSql('DROP TABLE timetable_entry');
        $this->addSql('DROP TABLE `user`');
    }
}
