'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BookOpen, Eye, LoaderCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRoleAccess } from '@/lib/use-role-access';
import { useLanguage } from '@/lib/language-context';

type Diploma = { id: number; code: string; name: string };
type Section = { id: number; diplomaId: number; diplomaCode: string; code: string; name: string; classProgram: string; status: string };
type AcademicClass = { id: number; sectionId: number; name: string; academicYear: string; studyYear: number; status: string };
type Teacher = { id: string; fullName: string; className: string };
type Subject = {
  id: number; name: string; category: string; description: string; diplomaId: number;
  diplomaCode: string; diplomaName: string; sectionId: number; sectionName: string;
  sectionCode: string; classId: number | null; className: string; academicYear: string;
  studyYear: number; semester: string; coefficient: number | null; weeklyHours: number | null;
  teacherId: string; teacherName: string; status: string;
};
type Catalogue = { diplomas: Diploma[]; sections: Section[]; classes: AcademicClass[]; teachers: Teacher[] };
type SubjectForm = {
  id?: number; name: string; diplomaId: string; sectionId: string; classId: string;
  academicYear: string; studyYear: number; semester: string; category: string;
  description: string; coefficient: string; weeklyHours: string; teacherId: string; status: string;
};

const defaultYear = '2026-2027';
const newSubject: SubjectForm = {
  name: '', diplomaId: '', sectionId: '', classId: '', academicYear: defaultYear,
  studyYear: 0, semester: 'Annual', category: 'Programme', description: '',
  coefficient: '', weeklyHours: '', teacherId: '', status: 'active',
};

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Unable to complete the request.');
  return data as T;
}

export default function SubjectsPage() {
  const { role } = useRoleAccess();
  const { t } = useLanguage();
  const [year, setYear] = useState(defaultYear);
  const [yearDraft, setYearDraft] = useState(defaultYear);
  const [catalogue, setCatalogue] = useState<Catalogue>({ diplomas: [], sections: [], classes: [], teachers: [] });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [diplomaFilter, setDiplomaFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [studyYearFilter, setStudyYearFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<SubjectForm>({ ...newSubject });
  const [details, setDetails] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  const load = async (requestedYear = year) => {
    setLoading(true);
    setError('');
    try {
      const [nextCatalogue, subjectData] = await Promise.all([
        readJson<Catalogue>(`/api/academic/catalogue?academicYear=${encodeURIComponent(requestedYear)}`),
        readJson<{ subjects: Subject[] }>(`/api/academic/subjects?academicYear=${encodeURIComponent(requestedYear)}`),
      ]);
      setCatalogue(nextCatalogue);
      setSubjects(subjectData.subjects);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load academic subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(year); }, [year]);

  const filteredSubjects = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return subjects.filter((subject) =>
      (diplomaFilter === 'all' || subject.diplomaCode === diplomaFilter) &&
      (sectionFilter === 'all' || String(subject.sectionId) === sectionFilter) &&
      (studyYearFilter === 'all' || String(subject.studyYear) === studyYearFilter) &&
      (semesterFilter === 'all' || subject.semester === semesterFilter) &&
      (!term || `${subject.name} ${subject.sectionName} ${subject.description}`.toLocaleLowerCase().includes(term)),
    );
  }, [subjects, query, diplomaFilter, sectionFilter, studyYearFilter, semesterFilter]);

  const visibleSections = catalogue.sections.filter((section) =>
    form.diplomaId ? section.diplomaId === Number(form.diplomaId) : true,
  );
  const formClasses = catalogue.classes.filter((academicClass) =>
    form.sectionId ? academicClass.sectionId === Number(form.sectionId) : false,
  );
  const sectionsForFilter = catalogue.sections.filter((section) =>
    diplomaFilter === 'all' || section.diplomaCode === diplomaFilter,
  );
  const totalSections = catalogue.sections.length;
  const activeCount = subjects.filter((subject) => subject.status === 'active').length;

  const openCreate = () => {
    setForm({ ...newSubject, academicYear: year });
    setError('');
    setIsFormOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setForm({
      id: subject.id, name: subject.name, diplomaId: String(subject.diplomaId),
      sectionId: String(subject.sectionId), classId: subject.classId ? String(subject.classId) : '',
      academicYear: subject.academicYear, studyYear: subject.studyYear, semester: subject.semester,
      category: subject.category, description: subject.description,
      coefficient: subject.coefficient === null ? '' : String(subject.coefficient),
      weeklyHours: subject.weeklyHours === null ? '' : String(subject.weeklyHours),
      teacherId: subject.teacherId, status: subject.status,
    });
    setError('');
    setIsFormOpen(true);
  };

  const submitSubject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await readJson<{ subject: Subject }>('/api/academic/subjects', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          diplomaId: Number(form.diplomaId), sectionId: Number(form.sectionId),
          classId: form.classId ? Number(form.classId) : null,
          studyYear: form.classId ? Number(formClasses.find((item) => item.id === Number(form.classId))?.studyYear ?? form.studyYear) : 0,
          coefficient: form.coefficient || null, weeklyHours: form.weeklyHours || null,
          teacherId: form.teacherId || null,
        }),
      });
      setIsFormOpen(false);
      setNotice(t(form.id ? 'Subject updated.' : 'Subject added.'));
      await load(year);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this subject.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (subject: Subject) => {
    setError('');
    try {
      await readJson('/api/academic/subjects', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subject.id, name: subject.name, diplomaId: subject.diplomaId,
          sectionId: subject.sectionId, classId: subject.classId, studyYear: subject.studyYear,
          academicYear: subject.academicYear, semester: subject.semester, category: subject.category,
          description: subject.description, coefficient: subject.coefficient,
          weeklyHours: subject.weeklyHours, teacherId: subject.teacherId || null,
          status: subject.status === 'active' ? 'inactive' : 'active',
        }),
      });
      setNotice(t(subject.status === 'active' ? 'Subject deactivated.' : 'Subject activated.'));
      await load(year);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to change subject status.');
    }
  };

  const deleteSubject = async () => {
    if (!deleteTarget) return;
    try {
      await readJson(`/api/academic/subjects?id=${deleteTarget.id}`, { method: 'DELETE' });
      setNotice(t('Subject deleted. Existing timetable sessions keep their saved display text.'));
      setDeleteTarget(null);
      await load(year);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this subject.');
      setDeleteTarget(null);
    }
  };

  if (role && role !== 'admin') {
    return <div className="p-8"><Card className="border border-border bg-card p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-foreground">{t('Admin access required')}</h1>
      <p className="mt-2 text-muted-foreground">{t('Academic subjects can only be managed by an administrator.')}</p>
    </Card></div>;
  }

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('Subjects Management')}</h1>
          <p className="mt-1 text-muted-foreground">{t('Manage the academic catalogue used by each class timetable.')}</p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start"><Plus className="h-4 w-4" />{t('Add Subject')}</Button>
      </div>

      {error && !isFormOpen && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{t(error)}</p>}
      {notice && <p role="status" className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">{notice}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t('Total subjects'), subjects.length], [t('Total sections'), totalSections],
          [t('Total diplomas'), catalogue.diplomas.length], [t('Active subjects'), activeCount],
        ].map(([label, value]) => <Card key={label} className="border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{loading ? '—' : value}</p>
        </Card>)}
      </div>

      <Card className="border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1 text-sm text-muted-foreground"><span>{t('Academic year')}</span>
            <Input value={yearDraft} onChange={(event) => setYearDraft(event.target.value)} onBlur={() => /^\d{4}-\d{4}$/.test(yearDraft) && setYear(yearDraft)} onKeyDown={(event) => { if (event.key === 'Enter' && /^\d{4}-\d{4}$/.test(yearDraft)) setYear(yearDraft); }} placeholder="2026-2027" aria-label={t('Academic year')} />
          </label>
          <label className="space-y-1 text-sm text-muted-foreground"><span>{t('Diploma')}</span>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={diplomaFilter} onChange={(event) => { setDiplomaFilter(event.target.value); setSectionFilter('all'); }}>
              <option value="all">{t('All diplomas')}</option>{catalogue.diplomas.map((diploma) => <option key={diploma.id} value={diploma.code}>{diploma.code}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-muted-foreground"><span>{t('Section')}</span>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
              <option value="all">{t('All sections')}</option>{sectionsForFilter.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-muted-foreground"><span>{t('Study year')}</span>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={studyYearFilter} onChange={(event) => setStudyYearFilter(event.target.value)}>
              <option value="all">{t('All years')}</option><option value="0">{t('All class years / CAP')}</option><option value="1">{t('1st year')}</option><option value="2">{t('2nd year')}</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-muted-foreground"><span>{t('Semester')}</span>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)}>
              <option value="all">{t('All semesters')}</option><option value="Annual">{t('Annual')}</option><option value="Semester 1">{t('Semester 1')}</option><option value="Semester 2">{t('Semester 2')}</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-muted-foreground"><span>{t('Search subjects')}</span>
            <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Subject name...')} /></div>
          </label>
        </div>
      </Card>

      <Card className="overflow-hidden border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-border bg-background/60 text-muted-foreground"><tr>
              {['Subject', 'Diploma', 'Section', 'Class / year', 'Semester', 'Coefficient', 'Weekly hours', 'Teacher', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{t(heading)}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {loading ? <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />{t('Loading subjects…')}</td></tr>
                : filteredSubjects.length === 0 ? <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">{t('No subjects match these filters.')}</td></tr>
                : filteredSubjects.map((subject) => <tr key={subject.id} className="hover:bg-background/40">
                  <td className="px-4 py-3"><div className="font-medium text-foreground">{subject.name}</div><div className="text-xs text-muted-foreground">{t(subject.category)}</div></td>
                  <td className="px-4 py-3">{subject.diplomaCode}</td><td className="px-4 py-3">{subject.sectionName}</td>
                  <td className="px-4 py-3">{subject.className || (subject.studyYear ? t(subject.studyYear === 1 ? '1st year' : '2nd year') : t('All years'))}</td>
                  <td className="px-4 py-3">{t(subject.semester)}</td><td className="px-4 py-3">{subject.coefficient ?? '—'}</td>
                  <td className="px-4 py-3">{subject.weeklyHours ?? '—'}</td><td className="px-4 py-3">{subject.teacherName || '—'}</td>
                  <td className="px-4 py-3"><Badge variant={subject.status === 'active' ? 'default' : 'secondary'}>{t(subject.status)}</Badge></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" aria-label={`${t('View subject')}: ${subject.name}`} onClick={() => setDetails(subject)}><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label={`${t('Edit subject')}: ${subject.name}`} onClick={() => openEdit(subject)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label={`${t(subject.status === 'active' ? 'Deactivate subject' : 'Activate subject')}: ${subject.name}`} onClick={() => void toggleStatus(subject)}><BookOpen className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label={`${t('Delete subject')}: ${subject.name}`} onClick={() => setDeleteTarget(subject)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div></td>
                </tr>)}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{t('Showing')} {filteredSubjects.length} {t('of')} {subjects.length} {t('subjects')} · {year}</div>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-border bg-card">
          <DialogHeader><DialogTitle>{t(form.id ? 'Edit Subject' : 'Add Subject')}</DialogTitle></DialogHeader>
          <form onSubmit={submitSubject} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm"><span>{t('Subject name')} *</span><Input required maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label className="space-y-1 text-sm"><span>{t('Diploma')} *</span><select required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.diplomaId} onChange={(event) => setForm({ ...form, diplomaId: event.target.value, sectionId: '', classId: '' })}><option value="">{t('Select diploma')}</option>{catalogue.diplomas.map((diploma) => <option key={diploma.id} value={diploma.id}>{diploma.code} — {diploma.name}</option>)}</select></label>
              <label className="space-y-1 text-sm"><span>{t('Section')} *</span><select required disabled={!form.diplomaId} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50" value={form.sectionId} onChange={(event) => setForm({ ...form, sectionId: event.target.value, classId: '' })}><option value="">{t('Select section')}</option>{visibleSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select></label>
              <label className="space-y-1 text-sm"><span>{t('Class / study year')}</span><select disabled={!form.sectionId || loading || form.academicYear !== year} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50" value={form.classId} onChange={(event) => { const selected = formClasses.find((item) => String(item.id) === event.target.value); setForm({ ...form, classId: event.target.value, studyYear: selected?.studyYear ?? 0 }); }}><option value="">{t('All study years')}</option>{formClasses.map((academicClass) => <option key={academicClass.id} value={academicClass.id}>{academicClass.name}</option>)}</select></label>
              <label className="space-y-1 text-sm"><span>{t('Academic year')} *</span><Input required pattern="[0-9]{4}-[0-9]{4}" value={form.academicYear} onChange={(event) => setForm({ ...form, academicYear: event.target.value })} onBlur={() => { if (/^\d{4}-\d{4}$/.test(form.academicYear)) { setYearDraft(form.academicYear); setYear(form.academicYear); if (form.academicYear !== year) setForm((current) => ({ ...current, classId: '', studyYear: 0 })); } }} placeholder="2026-2027" /></label>
              <label className="space-y-1 text-sm"><span>{t('Semester')} *</span><select required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })}><option value="Annual">{t('Annual')}</option><option value="Semester 1">{t('Semester 1')}</option><option value="Semester 2">{t('Semester 2')}</option></select></label>
              <label className="space-y-1 text-sm"><span>{t('Category')}</span><Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder={t('Programme')} /></label>
              <label className="space-y-1 text-sm"><span>{t('Coefficient')}</span><Input type="number" min="0.01" max="100" step="0.01" value={form.coefficient} onChange={(event) => setForm({ ...form, coefficient: event.target.value })} /></label>
              <label className="space-y-1 text-sm"><span>{t('Weekly hours')}</span><Input type="number" min="0.01" max="80" step="0.5" value={form.weeklyHours} onChange={(event) => setForm({ ...form, weeklyHours: event.target.value })} /></label>
              <label className="space-y-1 text-sm"><span>{t('Assigned teacher')}</span><select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.teacherId} onChange={(event) => setForm({ ...form, teacherId: event.target.value })}><option value="">{t('No assigned teacher')}</option>{catalogue.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}{teacher.className ? ` — ${teacher.className}` : ''}</option>)}</select></label>
              <label className="space-y-1 text-sm"><span>{t('Status')}</span><select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">{t('active')}</option><option value="inactive">{t('inactive')}</option></select></label>
            </div>
            <label className="block space-y-1 text-sm"><span>{t('Description')}</span><Textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{t('Cancel')}</Button><Button disabled={saving} type="submit">{saving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}{t(form.id ? 'Save Changes' : 'Add Subject')}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(details)} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="border-border bg-card"><DialogHeader><DialogTitle>{details?.name}</DialogTitle></DialogHeader>
          {details && <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="text-muted-foreground">{t('Diploma')}:</span> {details.diplomaCode}</p><p><span className="text-muted-foreground">{t('Section')}:</span> {details.sectionName}</p>
            <p><span className="text-muted-foreground">{t('Academic year')}:</span> {details.academicYear}</p><p><span className="text-muted-foreground">{t('Class')}:</span> {details.className || t('All years')}</p>
            <p><span className="text-muted-foreground">{t('Semester')}:</span> {t(details.semester)}</p><p><span className="text-muted-foreground">{t('Category')}:</span> {t(details.category)}</p>
            <p><span className="text-muted-foreground">{t('Coefficient')}:</span> {details.coefficient ?? '—'}</p><p><span className="text-muted-foreground">{t('Weekly hours')}:</span> {details.weeklyHours ?? '—'}</p>
            <p><span className="text-muted-foreground">{t('Teacher')}:</span> {details.teacherName || '—'}</p><p><span className="text-muted-foreground">{t('Status')}:</span> {t(details.status)}</p>
            <p className="sm:col-span-2"><span className="text-muted-foreground">{t('Description')}:</span> {details.description || '—'}</p>
          </div>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-border bg-card"><AlertDialogHeader><AlertDialogTitle>{t('Delete subject?')}</AlertDialogTitle><AlertDialogDescription>{t('Delete this subject? Existing timetable entries keep their saved display text.')} “{deleteTarget?.name}”</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('Cancel')}</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void deleteSubject(); }}>{t('Delete Subject')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
