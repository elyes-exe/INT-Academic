'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Plus, Trash2 } from 'lucide-react';
import { deleteResource, fetchResource, saveResource } from '@/lib/dashboard-client';
import { classSections, classSectionOptions, getDiplomaLevel } from '@/lib/class-sections';
import { useLanguage } from '@/lib/language-context';
import { useRoleAccess } from '@/lib/use-role-access';
import { getCurrentAccount } from '@/lib/local-auth';

type TimetableEntry = {
  id?: number;
  className: string;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  classroom: string;
};

type TeacherOption = {
  id: string;
  fullName: string;
  className: string;
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
];

const generalAudiovisualSubjects = [
  'Arabe',
  'Français',
  'Anglais',
  'Droit et devoirs citoyens',
  'Culture entrepreneuriale',
  'Culture de santé et de sécurité au travail',
  'Culture environnementale et maîtrise de l’énergie',
  'Culture numérique',
];

const subjectCurricula = [
  {
    classPrefix: 'BTS Réseau et Sécurité Informatique',
    groups: [
      {
        category: 'Compétences spécifiques',
        subjects: [
          'Sécurité des réseaux',
          'Réseaux locaux',
          'Système d’exploitation réseaux',
          'Administration des réseaux',
          'Système électronique numérique',
          'Système électronique analogique',
          'Appliquer les notions de base d’électricité et d’électromagnétisme',
          'Analyser les circuits à semi-conducteurs',
          'Algorithme et structure des données',
          'Architectures des systèmes informatiques et réseaux',
          'Microprocesseur',
          'Appliquer les notions de base de programmation des microcontrôleurs',
          'Interconnexion réseaux',
          'Ingénierie de câblages informatiques',
          'Réseaux sans fil',
          'Langage JavaScript',
          'Réseaux étendus',
          'Cloud computing',
          'Projet de fin de formation',
          'Stage d’initiation',
          'Stage d’intégration',
        ],
      },
      {
        category: 'Enseignement Général',
        subjects: [
          'Culture de santé et de sécurité au travail',
          'Français',
          'Anglais',
          'Arabe',
          'Législation du travail',
          'Culture environnementale et maîtrise de l’énergie',
          'Culture entrepreneuriale',
        ],
      },
    ],
  },
  {
    classPrefix: 'BTS Audiovisuel - Prise de Son',
    groups: [
      {
        category: 'Compétences spécifiques',
        subjects: [
          'Technique son',
          'Montage et effets spéciaux',
          'Acoustique',
          'Initiation à la prise de vue',
          'Découverte de la profession et de la démarche de formation',
          'Histoire du cinéma',
          'Installation et interconnexion des équipements sonores',
          'Lumière',
          'Utiliser l’outil informatique',
          'Analyse filmique',
          'Montage son et post-synchronisation',
          'Initiation à la réalisation',
          'Langage cinématographique',
          'Nouvelles technologies d’exploitation audiovisuelle',
          'Mixage et postproduction',
          'Traitement du signal',
          'Prise de son en studio',
          'Signal vidéo',
          'Musique cinématographique',
          'Écriture scénaristique',
          'Droit de l’audiovisuel',
          'Physique appliquée',
        ],
      },
      { category: 'Enseignement Général', subjects: generalAudiovisualSubjects },
    ],
  },
  {
    classPrefix: 'BTS Audiovisuel - Prise de Vue',
    groups: [
      {
        category: 'Compétences spécifiques',
        subjects: [
          'Prise de vue',
          'Photographie',
          'Traitement d’image numérique',
          'Machinerie et équipements audiovisuels',
          'Découverte de la profession et de la démarche de formation',
          'Histoire de l’art et du cinéma',
          'Lumière',
          'Technique de son',
          'Analyse filmique',
          'Utiliser l’outil informatique',
          'Postproduction',
          'Colorimétrie',
          'Initiation à la réalisation',
          'Langage cinématographique',
          'Technique caméra',
          'Signal vidéo',
          'Écriture scénaristique',
          'Direction d’acteur',
          'Droit de l’audiovisuel',
          'Initiation à la dramaturgie',
          'Gestion de la production',
        ],
      },
      { category: 'Enseignement Général', subjects: generalAudiovisualSubjects },
    ],
  },
];

const emptyEntry: TimetableEntry = {
  className: classSectionOptions[0],
  day: 'Monday',
  time: '',
  subject: '',
  teacher: '',
  classroom: '',
};

export default function TimetablePage() {
  const { t } = useLanguage();
  const { canManage, role } = useRoleAccess();
  const [selectedClass, setSelectedClass] = useState(classSectionOptions[0]);
  const [assignedClass, setAssignedClass] = useState('');
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherLoadError, setTeacherLoadError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TimetableEntry>(emptyEntry);

  const loadEntries = async () => {
    const [nextEntries, account] = await Promise.all([
      fetchResource<TimetableEntry>('timetable'),
      getCurrentAccount(),
    ]);
    setEntries(nextEntries);
    if (account?.role === 'student') {
      const studentClass = account.className ?? '';
      setAssignedClass(studentClass);
      setSelectedClass(studentClass);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    if (!canManage) return;

    let isMounted = true;

    async function loadTeachers() {
      try {
        const response = await fetch('/api/dashboard/teachers');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load teachers.');
        }

        if (isMounted) {
          setTeachers(data.teachers);
          setTeacherLoadError('');
        }
      } catch {
        if (isMounted) {
          setTeacherLoadError('Unable to load teachers.');
        }
      }
    }

    loadTeachers();

    return () => {
      isMounted = false;
    };
  }, [canManage]);

  const timetable = useMemo(
    () => entries.filter((entry) => entry.className === selectedClass),
    [entries, selectedClass],
  );
  const availableClasses = Array.from(new Set([
    ...classSectionOptions,
    ...entries.map((entry) => entry.className),
  ]));
  const selectedCurriculum = subjectCurricula.find(({ classPrefix }) =>
    selectedClass.startsWith(`${classPrefix} -`),
  );

  const handleAddSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedTeacher = teachers.find((teacher) => teacher.id === selectedTeacherId);
    if (!selectedTeacher) return;

    await saveResource<TimetableEntry>('timetable', {
      ...formData,
      className: selectedClass,
      teacher: `${selectedTeacher.fullName} - ${selectedTeacher.className}`,
    });
    await loadEntries();
    setFormData({ ...emptyEntry, className: selectedClass });
    setSelectedTeacherId('');
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    await deleteResource('timetable', id);
    await loadEntries();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t(canManage ? 'Timetable Management' : 'Timetable')}</h1>
          <p className="text-muted-foreground">{t(canManage ? 'View and manage class schedules' : 'View class schedules')}</p>
        </div>
        {canManage && <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({ ...emptyEntry, className: selectedClass });
                setSelectedTeacherId('');
              }}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4" />
              {t('Add Schedule')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{t('Add New Schedule')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Day')}</FieldLabel>
                  <select
                    value={formData.day}
                    onChange={(event) => setFormData({ ...formData, day: event.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background text-foreground border border-border"
                  >
                    {days.map((day) => (
                      <option key={day} value={day}>{t(day)}</option>
                    ))}
                  </select>
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Time Slot')}</FieldLabel>
                  <select
                    value={formData.time}
                    onChange={(event) => setFormData({ ...formData, time: event.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-background text-foreground border border-border"
                  >
                    <option value="">{t('Select time')}</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Subject')}</FieldLabel>
                  {selectedCurriculum ? (
                    <select
                      value={formData.subject}
                      onChange={(event) => setFormData({ ...formData, subject: event.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-background text-foreground border border-border"
                    >
                      <option value="">{t('Select subject')}</option>
                      {selectedCurriculum.groups.map(({ category, subjects }) => (
                        <optgroup key={category} label={category}>
                          {subjects.map((subject) => (
                            <option key={subject} value={subject}>{subject}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder={t('e.g., Mathematics')}
                      value={formData.subject}
                      onChange={(event) => setFormData({ ...formData, subject: event.target.value })}
                      required
                      className="bg-background text-foreground"
                    />
                  )}
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Teacher')}</FieldLabel>
                  <select
                    value={selectedTeacherId}
                    onChange={(event) => setSelectedTeacherId(event.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-background text-foreground border border-border"
                  >
                    <option value="">{t('Select a teacher')}</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName} - {teacher.className}
                      </option>
                    ))}
                  </select>
                  {teacherLoadError ? (
                    <p role="alert" className="text-xs text-destructive mt-1">{t(teacherLoadError)}</p>
                  ) : teachers.length === 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('No verified teachers are assigned to a section yet. Assign a section on Accounts.')}
                    </p>
                  ) : null}
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Classroom')}</FieldLabel>
                  <Input
                    placeholder={t('e.g., 101')}
                    value={formData.classroom}
                    onChange={(event) => setFormData({ ...formData, classroom: event.target.value })}
                    required
                    className="bg-background text-foreground"
                  />
                </Field>
              </FieldGroup>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('Cancel')}
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {t('Add Schedule')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>}
      </div>

      {role === 'student' ? (
        <Card className="bg-card border border-border p-6 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">{t('Your section')}</h3>
          <p className="text-foreground">{assignedClass || t('Loading class...')}</p>
        </Card>
      ) : role !== null && (
        <Card className="bg-card border border-border p-6 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">{t('Select Class')}</h3>
          <select
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
            className="w-full max-w-xl px-3 py-2 rounded-lg bg-background text-foreground border border-border"
          >
            {classSections.map(({ level }) => (
              <optgroup key={level} label={level}>
                {classSectionOptions.filter((className) => getDiplomaLevel(className) === level).map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </optgroup>
            ))}
            {availableClasses.filter((className) => !classSectionOptions.includes(className)).map((className) => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
        </Card>
      )}

      <Card className="bg-card border border-border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">{t('Time')}</th>
              {days.map((day) => (
                <th key={day} className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  {t(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot} className="border-b border-border hover:bg-background/50">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{slot}</td>
                {days.map((day) => {
                  const session = timetable.find((entry) => entry.day === day && entry.time === slot);
                  return (
                    <td key={`${day}-${slot}`} className="px-6 py-4">
                      {session ? (
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-primary text-sm">{session.subject}</p>
                              <p className="text-xs text-muted-foreground mt-1">{session.teacher}</p>
                              <p className="text-xs text-muted-foreground">{t('Room')} {session.classroom}</p>
                            </div>
                            {canManage && <Button variant="ghost" size="sm" onClick={() => session.id && handleDelete(session.id)}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-muted-foreground">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-6 text-sm text-muted-foreground">
        <span>{t('Class')} {selectedClass}: <strong className="text-foreground">{timetable.length} {t('sessions scheduled')}</strong></span>
      </div>
    </div>
  );
}
