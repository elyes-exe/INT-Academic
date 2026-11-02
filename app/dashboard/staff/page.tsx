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
import { useLanguage } from '@/lib/language-context';

type StaffMember = {
  id?: number;
  name: string;
  email: string;
  position: string;
  department: string;
  joinDate: string;
};

const emptyStaff: StaffMember = {
  name: '',
  email: '',
  position: '',
  department: '',
  joinDate: '',
};

export default function StaffPage() {
  const { t } = useLanguage();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<StaffMember>(emptyStaff);

  const loadStaff = async () => {
    setStaff(await fetchResource<StaffMember>('staff'));
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSaveStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveResource<StaffMember>('staff', editingId ? { ...formData, id: editingId } : formData);
    await loadStaff();
    setFormData(emptyStaff);
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (member: StaffMember) => {
    setFormData(member);
    setEditingId(member.id ?? null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteResource('staff', id);
    await loadStaff();
  };

  const handleReset = () => {
    setFormData(emptyStaff);
    setEditingId(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('Staff Management')}</h1>
          <p className="text-muted-foreground">{t('Manage faculty and staff information')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleReset} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
              {t('Add Staff')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {t(editingId ? 'Edit Staff Member' : 'Add New Staff')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveStaff} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Full Name')}</FieldLabel>
                  <Input
                    placeholder={t('Enter staff name')}
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
                    placeholder="staff@int.edu"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    required
                    className="bg-background text-foreground"
                  />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Position')}</FieldLabel>
                  <Input
                    placeholder={t('e.g., Mathematics Teacher')}
                    value={formData.position}
                    onChange={(event) => setFormData({ ...formData, position: event.target.value })}
                    required
                    className="bg-background text-foreground"
                  />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Department')}</FieldLabel>
                  <Input
                    placeholder={t('e.g., Science')}
                    value={formData.department}
                    onChange={(event) => setFormData({ ...formData, department: event.target.value })}
                    required
                    className="bg-background text-foreground"
                  />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Join Date')}</FieldLabel>
                  <Input
                    type="date"
                    value={formData.joinDate}
                    onChange={(event) => setFormData({ ...formData, joinDate: event.target.value })}
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
                  {t(editingId ? 'Update' : 'Add')} {t('Staff')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border border-border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('Search by name, email, or position...')}
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
              <TableHead className="text-foreground font-semibold">{t('Position')}</TableHead>
              <TableHead className="text-foreground font-semibold">{t('Department')}</TableHead>
              <TableHead className="text-foreground font-semibold">{t('Email')}</TableHead>
              <TableHead className="text-foreground font-semibold">{t('Join Date')}</TableHead>
              <TableHead className="text-foreground font-semibold text-right">{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length > 0 ? (
              filteredStaff.map((member) => (
                <TableRow key={member.id} className="hover:bg-background/50 border-b border-border">
                  <TableCell className="font-medium text-foreground">{member.name}</TableCell>
                  <TableCell className="text-foreground">{member.position}</TableCell>
                  <TableCell className="text-foreground">{member.department}</TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell className="text-muted-foreground">{member.joinDate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border border-border">
                        <DropdownMenuItem
                          onClick={() => handleEdit(member)}
                          className="text-foreground hover:bg-background cursor-pointer flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          {t('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => member.id && handleDelete(member.id)}
                          className="text-destructive hover:bg-destructive/10 cursor-pointer flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('No staff members found')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>{t('Total Staff:')} <strong className="text-foreground">{filteredStaff.length}</strong></span>
      </div>
    </div>
  );
}
