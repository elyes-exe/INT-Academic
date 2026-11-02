'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Plus, Calendar, Users, Trash2 } from 'lucide-react';
import { deleteResource, fetchResource, saveResource } from '@/lib/dashboard-client';
import { useLanguage } from '@/lib/language-context';

type Exam = {
  id?: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  classes: number;
};

const emptyExam: Exam = {
  name: '',
  status: 'Planned',
  startDate: '',
  endDate: '',
  classes: 0,
};

const statuses = ['Planned', 'Scheduled', 'Completed'];

export default function ExamsPage() {
  const { t } = useLanguage();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Exam>(emptyExam);

  const loadExams = async () => {
    setExams(await fetchResource<Exam>('exams'));
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleSaveExam = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveResource<Exam>('exams', editingId ? { ...formData, id: editingId } : formData);
    await loadExams();
    setFormData(emptyExam);
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (exam: Exam) => {
    setFormData(exam);
    setEditingId(exam.id ?? null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteResource('exams', id);
    await loadExams();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'Planned':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'Completed':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('Examination Management')}</h1>
          <p className="text-muted-foreground">{t('Schedule and manage examinations')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setFormData(emptyExam); setEditingId(null); }} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
              {t('Schedule Exam')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t(editingId ? 'Edit Exam' : 'Schedule Exam')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveExam} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Name')}</FieldLabel>
                  <Input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Status')}</FieldLabel>
                  <select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} className="w-full px-3 py-2 rounded-lg bg-background text-foreground border border-border">
                    {statuses.map((status) => <option key={status} value={status}>{t(status)}</option>)}
                  </select>
                </Field>
              </FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>{t('Start Date')}</FieldLabel>
                    <Input type="date" value={formData.startDate} onChange={(event) => setFormData({ ...formData, startDate: event.target.value })} required />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel>{t('End Date')}</FieldLabel>
                    <Input type="date" value={formData.endDate} onChange={(event) => setFormData({ ...formData, endDate: event.target.value })} required />
                  </Field>
                </FieldGroup>
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Classes Count')}</FieldLabel>
                  <Input type="number" value={formData.classes} onChange={(event) => setFormData({ ...formData, classes: Number(event.target.value) })} required />
                </Field>
              </FieldGroup>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('Cancel')}</Button>
                <Button type="submit">{t(editingId ? 'Update' : 'Schedule')} {t('Exam')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {exams.map((exam) => (
          <Card key={exam.id} className="bg-card border border-border p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-bold text-foreground">{exam.name}</h3>
                  <Badge className={getStatusColor(exam.status)}>{t(exam.status)}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{exam.startDate} {t('to')} {exam.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{exam.classes} {t('classes')}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleEdit(exam)} className="text-foreground border-border hover:bg-secondary">
                  {t('View Details')}
                </Button>
                <Button variant="ghost" onClick={() => exam.id && handleDelete(exam.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
