'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Plus, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { deleteResource, fetchResource, saveResource } from '@/lib/dashboard-client';
import { classSections, getDiplomaLevel, type DiplomaLevel } from '@/lib/class-sections';
import { useLanguage } from '@/lib/language-context';
import { useRoleAccess } from '@/lib/use-role-access';

type Student = {
  id?: number;
  name: string;
  email: string;
  class: string;
  enrollment: string;
};

const emptyStudent: Student = { name: '', email: '', class: '', enrollment: '' };

export default function StudentsPage() {
  const { t } = useLanguage();
  const { canManage } = useRoleAccess();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<DiplomaLevel | 'All'>('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Student>(emptyStudent);

  const loadStudents = async () => {
    setStudents(await fetchResource<Student>('students'));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const sectionFilteredStudents = filteredStudents.filter((student) =>
    selectedLevel === 'All' || getDiplomaLevel(student.class) === selectedLevel,
  );

  const handleSaveStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveResource<Student>('students', editingId ? { ...formData, id: editingId } : formData);
    await loadStudents();
    setFormData(emptyStudent);
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (student: Student) => {
    setFormData(student);
    setEditingId(student.id ?? null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteResource('students', id);
    await loadStudents();
  };

  const handleReset = () => {
    setFormData(emptyStudent);
    setEditingId(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t(canManage ? 'Students Management' : 'Students')}</h1>
          <p className="text-muted-foreground">{t(canManage ? 'Manage student records and enrollment' : 'Browse students by program')}</p>
        </div>
        {canManage && <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleReset} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
              {t('Add Student')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {t(editingId ? 'Edit Student' : 'Add New Student')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Full Name')}</FieldLabel>
                  <Input
                    placeholder={t('Enter student name')}
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    required
                    className="bg-background text-foreground"
                  />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Email')}</FieldLabel>
                  <Input
                    type="email"
                    placeholder="student@int.edu"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    required
                    className="bg-background text-foreground"
                  />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Class')}</FieldLabel>
                  <select
                    value={formData.class}
                    onChange={(event) => setFormData({ ...formData, class: event.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-background text-foreground border border-border"
                  >
                    <option value="">{t('Select Class')}</option>
                    {formData.class && getDiplomaLevel(formData.class) === null && (
                      <option value={formData.class}>{formData.class}</option>
                    )}
                    {classSections.map(({ level, programs }) => (
                      <optgroup key={level} label={level}>
                        {programs.map((program) => {
                          const className = `${level} ${program}`;
                          return <option key={className} value={className}>{className}</option>;
                        })}
                      </optgroup>
                    ))}
                  </select>
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Enrollment Date')}</FieldLabel>
                  <Input
                    type="date"
                    value={formData.enrollment}
                    onChange={(event) => setFormData({ ...formData, enrollment: event.target.value })}
                    required
                    className="bg-background text-foreground"
                  />
                </Field>
              </FieldGroup>
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    handleReset();
                  }}
                  className="text-foreground border-border hover:bg-secondary"
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {t(editingId ? 'Update' : 'Add')} {t('Student')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(['All', ...classSections.map(({ level }) => level)] as const).map((level) => (
          <Button
            key={level}
            type="button"
            variant={selectedLevel === level ? 'default' : 'outline'}
            onClick={() => setSelectedLevel(level)}
            className={selectedLevel === level ? '' : 'text-foreground border-border'}
          >
            {level === 'All' ? t('All Classes') : level}
          </Button>
        ))}
      </div>

      <Card className="bg-card border border-border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('Search by name, email, or class...')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10 bg-background text-foreground placeholder:text-muted-foreground border-border"
          />
        </div>
      </Card>

      <Card className="bg-card border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50 border-b border-border">
            <TableRow className="hover:bg-background/50">
              <TableHead className="text-foreground font-semibold">{t('Name')}</TableHead>
              <TableHead className="text-foreground font-semibold">{t('Class')}</TableHead>
              <TableHead className="text-foreground font-semibold">{t('Email')}</TableHead>
              <TableHead className="text-foreground font-semibold">{t('Enrollment Date')}</TableHead>
              {canManage && <TableHead className="text-foreground font-semibold text-right">{t('Actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sectionFilteredStudents.length > 0 ? (
              sectionFilteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-background/50 border-b border-border">
                  <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                  <TableCell className="text-foreground">{student.class}</TableCell>
                  <TableCell className="text-muted-foreground">{student.email}</TableCell>
                  <TableCell className="text-muted-foreground">{student.enrollment}</TableCell>
                  {canManage && <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border border-border">
                        <DropdownMenuItem
                          onClick={() => handleEdit(student)}
                          className="text-foreground hover:bg-background cursor-pointer flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          {t('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => student.id && handleDelete(student.id)}
                          className="text-destructive hover:bg-destructive/10 cursor-pointer flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="text-center py-8 text-muted-foreground">
                  {t('No students found')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>{t('Total Students:')} <strong className="text-foreground">{sectionFilteredStudents.length}</strong></span>
      </div>
    </div>
  );
}
