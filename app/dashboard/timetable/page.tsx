'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Check, LoaderCircle, Plus, Search, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { deleteResource, fetchResource, saveResource } from '@/lib/dashboard-client';
import { useLanguage } from '@/lib/language-context';
import { useRoleAccess } from '@/lib/use-role-access';
import { getCurrentAccount } from '@/lib/local-auth';

type TimetableEntry = {
  id?: number;
  classId?: number | null;
  academicYear?: string;
  subjectId?: number | null;
  teacherId?: string | null;
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

type SubjectOption = { id: number; name: string; category: string; teacherId: string; teacherName: string };
type AcademicClassOption = { id: number; name: string; academicYear: string; studyYear: number; diplomaCode: string };

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
];

const emptyEntry: TimetableEntry = {
  className: '',
  day: 'Monday',
  time: '',
  subject: '',
  teacher: '',
  classroom: '',
};

export default function TimetablePage() {
  const { t } = useLanguage();
  const { canManage, role } = useRoleAccess();
  const [selectedClass, setSelectedClass] = useState('');
  const [assignedClass, setAssignedClass] = useState('');
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherLoadError, setTeacherLoadError] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TimetableEntry>(emptyEntry);

  const loadEntries = async () => {
    const [nextEntries, account, catalogueResponse] = await Promise.all([
      fetchResource<TimetableEntry>('timetable'),
      getCurrentAccount(),
      fetch('/api/academic/catalogue?academicYear=2026-2027'),
    ]);
    const catalogueData = await catalogueResponse.json();
    if (!catalogueResponse.ok) throw new Error(catalogueData.message || 'Unable to load academic classes.');
    setEntries(nextEntries);
    const classOptions = (catalogueData.classes ?? []) as AcademicClassOption[];
    setAcademicClasses(classOptions);
    if (account?.role === 'student') {
      const studentClass = account.className ?? '';
      setAssignedClass(studentClass);
      setSelectedClass(studentClass);
    } else if (classOptions.length > 0) {
      setSelectedClass((current) => current || classOptions[0].name);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    if (!isDialogOpen || !selectedClass) return;
    let isMounted = true;
    setSubjectsLoading(true);
    setSubjectsError('');
    setSubjectSearch('');
    setSubjects([]);
    setSelectedTeacherId('');
    setFormData((current) => ({ ...current, subject: '', subjectId: undefined, teacher: '', teacherId: undefined }));
    fetch(`/api/academic/subjects?className=${encodeURIComponent(selectedClass)}&academicYear=2026-2027`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load subjects.');
        if (isMounted) setSubjects((data.subjects ?? []) as SubjectOption[]);
      })
      .catch((error: unknown) => {
        if (isMounted) setSubjectsError(error instanceof Error ? error.message : 'Unable to load subjects.');
      })
      .finally(() => { if (isMounted) setSubjectsLoading(false); });
    return () => { isMounted = false; };
  }, [isDialogOpen, selectedClass]);

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
    ...academicClasses.map((academicClass) => academicClass.name),
    ...entries.map((entry) => entry.className).filter((className) => !/^(Labo\s+\d+|ST\d+)$/i.test(className)),
  ]));
  const selectedSubject = subjects.find((subject) => subject.id === formData.subjectId);
  const classTeachers = teachers.filter((teacher) => teacher.className === selectedClass);
  const visibleSubjects = subjects.filter((subject) =>
    `${subject.name} ${subject.category}`.toLocaleLowerCase().includes(subjectSearch.trim().toLocaleLowerCase()),
  );

  const handleAddSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedTeacher = teachers.find((teacher) => teacher.id === selectedTeacherId);
    const subjectTeacher = selectedSubject?.teacherName ?? '';
    const teacherName = selectedTeacher
      ? `${selectedTeacher.fullName} - ${selectedTeacher.className}`
      : subjectTeacher || formData.teacher.trim();
    if (!selectedSubject) {
      setScheduleError('Choose a subject from this class to continue.');
      return;
    }
    if (!teacherName) {
      setScheduleError('Enter or select a teacher.');
      return;
    }
    try {
      setScheduleError('');
      await saveResource<TimetableEntry>('timetable', {
        ...formData,
        className: selectedClass,
        classId: academicClasses.find((item) => item.name === selectedClass)?.id,
        academicYear: '2026-2027',
        subjectId: selectedSubject.id,
        subject: selectedSubject.name,
        teacherId: selectedTeacherId || selectedSubject.teacherId || undefined,
        teacher: teacherName,
      });
      await loadEntries();
      setFormData({ ...emptyEntry, className: selectedClass });
      setSelectedTeacherId('');
      setIsDialogOpen(false);
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : 'Unable to save this schedule.');
    }
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
          <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto bg-card border border-border">
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
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} placeholder={t('Search subjects...')} className="bg-background pl-9 text-foreground" aria-label={t('Search subjects')} />
                    </div>
                    <ScrollArea className="h-[200px] rounded-lg border border-border bg-background">
                      <div role="listbox" aria-label={t('Available subjects')} className="p-1">
                        {subjectsLoading ? <div className="flex h-24 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />{t('Loading subjects...')}</div>
                          : subjectsError ? <p role="alert" className="p-4 text-sm text-destructive">{t(subjectsError)}</p>
                          : subjects.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{t('No subjects assigned to this section yet.')}</p>
                          : visibleSubjects.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{t('No subjects match your search.')}</p>
                          : visibleSubjects.map((subject) => <button
                            key={subject.id}
                            type="button"
                            role="option"
                            aria-selected={formData.subjectId === subject.id}
                            onClick={() => {
                              setFormData({ ...formData, subjectId: subject.id, subject: subject.name, teacherId: subject.teacherId || undefined, teacher: subject.teacherName });
                              setSelectedTeacherId(subject.teacherId || '');
                              setScheduleError('');
                            }}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-primary/10 ${formData.subjectId === subject.id ? 'bg-primary/15 text-primary' : 'text-foreground'}`}
                          >
                            <span><span className="block">{subject.name}</span><span className="text-xs text-muted-foreground">{t(subject.category)}</span></span>
                            {formData.subjectId === subject.id && <Check className="h-4 w-4 shrink-0" />}
                          </button>)}
                      </div>
                    </ScrollArea>
                    {selectedSubject && <p className="text-xs text-muted-foreground">{t('Selected')}: {selectedSubject.name}</p>}
                  </div>
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Teacher')}</FieldLabel>
                  {selectedSubject?.teacherId ? (
                    <div>
                      <Input value={selectedSubject.teacherName || teachers.find((teacher) => teacher.id === selectedSubject.teacherId)?.fullName || ''} readOnly className="bg-background text-foreground" />
                      <p className="mt-1 text-xs text-muted-foreground">{t('Teacher assigned to this subject')}</p>
                    </div>
                  ) : classTeachers.length > 0 ? (
                    <select
                      value={selectedTeacherId}
                      onChange={(event) => { setSelectedTeacherId(event.target.value); setFormData({ ...formData, teacherId: event.target.value || undefined, teacher: '' }); }}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-background text-foreground border border-border"
                    >
                      <option value="">{t('Select a teacher')}</option>
                      {classTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName} - {teacher.className}</option>)}
                    </select>
                  ) : (
                    <div>
                      <Input placeholder={t('Teacher name')} value={formData.teacher} onChange={(event) => setFormData({ ...formData, teacher: event.target.value, teacherId: undefined })} required className="bg-background text-foreground" />
                      {teacherLoadError ? <p role="alert" className="mt-1 text-xs text-destructive">{t(teacherLoadError)}</p> : <p className="mt-1 text-xs text-muted-foreground">{t('No verified teachers are assigned to this class yet. Enter the teacher name for now.')}</p>}
                    </div>
                  )}
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
              {scheduleError && <p role="alert" className="text-sm text-destructive">{t(scheduleError)}</p>}
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
            {Array.from(new Set(academicClasses.map((academicClass) => academicClass.diplomaCode))).map((diplomaCode) => (
              <optgroup key={diplomaCode} label={diplomaCode}>
                {academicClasses.filter((academicClass) => academicClass.diplomaCode === diplomaCode).map((academicClass) => <option key={academicClass.id} value={academicClass.name}>{academicClass.name}</option>)}
              </optgroup>
            ))}
            {availableClasses.filter((className) => !academicClasses.some((academicClass) => academicClass.name === className)).map((className) => <option key={className} value={className}>{className}</option>)}
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
