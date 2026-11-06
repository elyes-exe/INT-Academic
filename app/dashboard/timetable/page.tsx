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
import { classSections, classSectionOptions, legacyClassOptions } from '@/lib/class-sections';
import { useLanguage } from '@/lib/language-context';
import { useRoleAccess } from '@/lib/use-role-access';

type TimetableEntry = {
  id?: number;
  className: string;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  classroom: string;
};

const legacyClasses = legacyClassOptions;
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
  className: classSectionOptions[0],
  day: 'Monday',
  time: '',
  subject: '',
  teacher: '',
  classroom: '',
};

export default function TimetablePage() {
  const { t } = useLanguage();
  const { canManage } = useRoleAccess();
  const [selectedClass, setSelectedClass] = useState(classSectionOptions[0]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TimetableEntry>(emptyEntry);

  const loadEntries = async () => {
    setEntries(await fetchResource<TimetableEntry>('timetable'));
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const timetable = useMemo(
    () => entries.filter((entry) => entry.className === selectedClass),
    [entries, selectedClass],
  );
  const availableClasses = Array.from(new Set([
    ...classSectionOptions,
    ...legacyClasses,
    ...entries.map((entry) => entry.className),
  ]));

  const handleAddSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveResource<TimetableEntry>('timetable', { ...formData, className: selectedClass });
    await loadEntries();
    setFormData({ ...emptyEntry, className: selectedClass });
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
              onClick={() => setFormData({ ...emptyEntry, className: selectedClass })}
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
                  <Input
                    placeholder={t('e.g., Mathematics')}
                    value={formData.subject}
                    onChange={(event) => setFormData({ ...formData, subject: event.target.value })}
                    required
                    className="bg-background text-foreground"
                  />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Teacher')}</FieldLabel>
                  <Input
                    placeholder={t('Teacher name')}
                    value={formData.teacher}
                    onChange={(event) => setFormData({ ...formData, teacher: event.target.value })}
                    required
                    className="bg-background text-foreground"
                  />
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

      <Card className="bg-card border border-border p-6 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('Select Class')}</h3>
        <select
          value={selectedClass}
          onChange={(event) => setSelectedClass(event.target.value)}
          className="w-full max-w-xl px-3 py-2 rounded-lg bg-background text-foreground border border-border"
        >
          {classSections.map(({ level, programs }) => (
            <optgroup key={level} label={level}>
              {programs.map((program) => {
                const className = `${level} ${program}`;
                return <option key={className} value={className}>{className}</option>;
              })}
            </optgroup>
          ))}
          {legacyClasses.length > 0 && (
            <optgroup label={t('Legacy Classes')}>
              {availableClasses.filter((className) => legacyClasses.includes(className)).map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </optgroup>
          )}
          {availableClasses.filter((className) => !classSectionOptions.includes(className) && !legacyClasses.includes(className)).map((className) => (
            <option key={className} value={className}>{className}</option>
          ))}
        </select>
      </Card>

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
