'use client';

import { useEffect, useState } from 'react';
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Plus, Users, MapPin, BookOpen, Trash2 } from 'lucide-react';
import { deleteResource, fetchResource, saveResource } from '@/lib/dashboard-client';
import { useLanguage } from '@/lib/language-context';

type Classroom = {
  id?: number;
  name: string;
  floor: string;
  capacity: number;
  classSize: number;
};

const emptyClassroom: Classroom = {
  name: '',
  floor: '',
  capacity: 0,
  classSize: 0,
};

export default function ClassroomsPage() {
  const { t } = useLanguage();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Classroom>(emptyClassroom);

  const loadClassrooms = async () => {
    setClassrooms(await fetchResource<Classroom>('classrooms'));
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  const handleSaveClassroom = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveResource<Classroom>('classrooms', editingId ? { ...formData, id: editingId } : formData);
    await loadClassrooms();
    setFormData(emptyClassroom);
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (classroom: Classroom) => {
    setFormData(classroom);
    setEditingId(classroom.id ?? null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteResource('classrooms', id);
    await loadClassrooms();
  };

  const resetForm = () => {
    setFormData(emptyClassroom);
    setEditingId(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('Classrooms Management')}</h1>
          <p className="text-muted-foreground">{t('Manage classroom resources and assignments')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
              {t('Add Classroom')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border">
            <DialogHeader>
              <DialogTitle>{t(editingId ? 'Edit Classroom' : 'Add Classroom')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveClassroom} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Name')}</FieldLabel>
                  <Input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Floor / Location')}</FieldLabel>
                  <Input value={formData.floor} onChange={(event) => setFormData({ ...formData, floor: event.target.value })} required />
                </Field>
              </FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>{t('Capacity')}</FieldLabel>
                    <Input type="number" value={formData.capacity} onChange={(event) => setFormData({ ...formData, capacity: Number(event.target.value) })} required />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel>{t('Current Usage')}</FieldLabel>
                    <Input type="number" value={formData.classSize} onChange={(event) => setFormData({ ...formData, classSize: Number(event.target.value) })} required />
                  </Field>
                </FieldGroup>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('Cancel')}</Button>
                <Button type="submit">{t(editingId ? 'Update' : 'Add')} {t('Classroom')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.map((classroom) => {
          const capacity = Number(classroom.capacity) || 1;
          const usage = Math.min(100, Math.round((Number(classroom.classSize) / capacity) * 100));

          return (
            <Card key={classroom.id} className="bg-card border border-border p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{classroom.name}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{classroom.floor}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => classroom.id && handleDelete(classroom.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{t('Capacity')}</span>
                  </div>
                  <span className="font-semibold text-foreground">{classroom.capacity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span>{t('Current Usage')}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {classroom.classSize}/{classroom.capacity}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${usage}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{usage}% {t('Occupied')}</p>
                </div>
              </div>

              <Button variant="outline" onClick={() => handleEdit(classroom)} className="w-full mt-4 text-foreground border-border hover:bg-secondary">
                {t('Edit Details')}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
