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
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Trash2, Calendar } from 'lucide-react';
import { deleteResource, fetchResource, saveResource } from '@/lib/dashboard-client';
import { useLanguage } from '@/lib/language-context';
import { useRoleAccess } from '@/lib/use-role-access';

type Announcement = {
  id?: number;
  title: string;
  content: string;
  target: string;
  priority: string;
  date: string;
};

const emptyAnnouncement: Announcement = {
  title: '',
  content: '',
  target: 'All',
  priority: 'Normal',
  date: new Date().toISOString().split('T')[0],
};

const targetOptions = ['All', 'Students', 'Staff', 'Parents'];
const priorityOptions = ['Low', 'Normal', 'Medium', 'High'];

export default function AnnouncementsPage() {
  const { t } = useLanguage();
  const { canManage } = useRoleAccess();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Announcement>(emptyAnnouncement);

  const loadAnnouncements = async () => {
    setAnnouncements(await fetchResource<Announcement>('announcements'));
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSaveAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveResource<Announcement>(
      'announcements',
      editingId ? { ...formData, id: editingId } : formData,
    );
    await loadAnnouncements();
    setFormData({ ...emptyAnnouncement, date: new Date().toISOString().split('T')[0] });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData(announcement);
    setEditingId(announcement.id ?? null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteResource('announcements', id);
    await loadAnnouncements();
  };

  const handleReset = () => {
    setFormData({ ...emptyAnnouncement, date: new Date().toISOString().split('T')[0] });
    setEditingId(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-destructive text-destructive-foreground';
      case 'Medium':
        return 'bg-orange-500 text-white dark:bg-orange-600';
      case 'Normal':
        return 'bg-blue-500 text-white dark:bg-blue-600';
      default:
        return 'bg-gray-500 text-white dark:bg-gray-600';
    }
  };

  const getTargetColor = (target: string) => {
    switch (target) {
      case 'All':
        return 'bg-primary/10 text-primary';
      case 'Students':
        return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'Staff':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
      case 'Parents':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('Announcements')}</h1>
          <p className="text-muted-foreground">{t('Create and manage institution announcements')}</p>
        </div>
        {canManage && <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleReset} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
              {t('Create Announcement')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {t(editingId ? 'Edit Announcement' : 'Create New Announcement')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Title')}</FieldLabel>
                  <Input
                    placeholder={t('Announcement title')}
                    value={formData.title}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    required
                    className="bg-background text-foreground"
                  />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Content')}</FieldLabel>
                  <Textarea
                    placeholder={t('Write announcement details...')}
                    value={formData.content}
                    onChange={(event) => setFormData({ ...formData, content: event.target.value })}
                    required
                    className="bg-background text-foreground min-h-32"
                  />
                </Field>
              </FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>{t('Target Audience')}</FieldLabel>
                    <select
                      value={formData.target}
                      onChange={(event) => setFormData({ ...formData, target: event.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background text-foreground border border-border"
                    >
                      {targetOptions.map((option) => (
                        <option key={option} value={option}>{t(option)}</option>
                      ))}
                    </select>
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel>{t('Priority')}</FieldLabel>
                    <select
                      value={formData.priority}
                      onChange={(event) => setFormData({ ...formData, priority: event.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background text-foreground border border-border"
                    >
                      {priorityOptions.map((option) => (
                        <option key={option} value={option}>{t(option)}</option>
                      ))}
                    </select>
                  </Field>
                </FieldGroup>
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Date')}</FieldLabel>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(event) => setFormData({ ...formData, date: event.target.value })}
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
                  {t(editingId ? 'Update' : 'Create')} {t('Announcement')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>}
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="bg-card border border-border p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-foreground">{announcement.title}</h3>
                  <Badge className={getPriorityColor(announcement.priority)}>{t(announcement.priority)}</Badge>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">{announcement.content}</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{announcement.date}</span>
                  </div>
                  <Badge className={getTargetColor(announcement.target)}>{t(announcement.target)}</Badge>
                </div>
              </div>
              {canManage && <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border border-border">
                  <DropdownMenuItem onClick={() => handleEdit(announcement)} className="text-foreground cursor-pointer">
                    {t('Edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => announcement.id && handleDelete(announcement.id)}
                    className="text-destructive hover:bg-destructive/10 cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('Delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 text-sm text-muted-foreground">
        <span>{t('Total Announcements:')} <strong className="text-foreground">{announcements.length}</strong></span>
      </div>
    </div>
  );
}
