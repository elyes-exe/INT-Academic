'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'fr';

const french: Record<string, string> = {
  Academic: 'Académique', Dashboard: 'Tableau de bord', Students: 'Étudiants', Staff: 'Personnel',
  Timetable: 'Emploi du temps', Classrooms: 'Salles de classe', Exams: 'Examens', Announcements: 'Annonces',
  Accounts: 'Comptes', Settings: 'Paramètres', 'Search...': 'Rechercher...', Logout: 'Déconnexion',
  'Switch to French': 'Passer en français', 'Switch to English': 'Passer en anglais',
  'Switch to light mode': 'Activer le mode clair', 'Switch to dark mode': 'Activer le mode sombre',
  'Checking account access...': 'Vérification de l’accès au compte…', 'Welcome to INT App': 'Bienvenue sur INT App',
  'Redirecting to login...': 'Redirection vers la connexion…',
  'Manage your academic institution efficiently': 'Gérez efficacement votre établissement scolaire',
  'Manage student records and enrollment': 'Gérez les dossiers et les inscriptions des étudiants',
  'Browse students by program': 'Parcourez les étudiants par filière',
  'Browse students in your assigned class': 'Consultez les étudiants de votre classe',
  'Your assigned class': 'Votre classe', 'Assign class': 'Affecter une classe',
  Unassigned: 'Non affecté', 'Assign a class before verifying': 'Affectez une classe avant de vérifier le compte',
  'Manage faculty and staff information': 'Gérez les informations du corps enseignant et du personnel',
  'View and manage class schedules': 'Consultez et gérez les emplois du temps des classes',
  'View class schedules': 'Consultez les emplois du temps des classes',
  'Manage classroom resources and assignments': 'Gérez les salles de classe et leur affectation',
  'View classroom resources and assignments': 'Consultez les salles de classe et leur affectation',
  'Schedule and manage examinations': 'Planifiez et gérez les examens',
  'Create and manage institution announcements': 'Créez et gérez les annonces de l’établissement',
  'Manage your account information and preferences': 'Gérez les informations et les préférences de votre compte',
  'Classrooms Management': 'Gestion des salles de classe', 'Examination Management': 'Gestion des examens',
  'Exam Schedule': 'Calendrier des examens', 'View scheduled exams by class': 'Consultez les examens planifiés par classe',
  'All Classes': 'Toutes les classes', 'All sections': 'Toutes les filières', 'Legacy Classes': 'Anciennes classes',
  'Timetable Management': 'Gestion des emplois du temps', 'Students Management': 'Gestion des étudiants',
  'Staff Management': 'Gestion du personnel', 'Account Moderation': 'Gestion des comptes',
  'Verify student signups and adjust account roles': 'Vérifiez les inscriptions des étudiants et modifiez les rôles des comptes',
  'Admin access required': 'Accès administrateur requis', Name: 'Nom', 'Full Name': 'Nom complet',
  Email: 'E-mail', 'Email Address': 'Adresse e-mail', Class: 'Classe', Position: 'Poste', Department: 'Département',
  Capacity: 'Capacité', 'Current Usage': 'Occupation actuelle', 'Floor / Location': 'Étage / Emplacement',
  Status: 'Statut', Role: 'Rôle', Created: 'Créé le', Actions: 'Actions', Date: 'Date', Time: 'Heure',
  Title: 'Titre', Content: 'Contenu', 'Target Audience': 'Public cible', Priority: 'Priorité',
  'Start Date': 'Date de début', 'End Date': 'Date de fin', 'Classes Count': 'Nombre de classes', Day: 'Jour',
  'Time Slot': 'Créneau horaire', Subject: 'Matière', Teacher: 'Enseignant', Classroom: 'Salle de classe',
  'Enrollment Date': 'Date d’inscription', 'Join Date': 'Date d’arrivée', 'Phone Number': 'Numéro de téléphone',
  'Account Status': 'État du compte', 'My Account': 'Mon compte', Notifications: 'Notifications',
  'Push Notifications': 'Notifications push', 'Email Alerts': 'Alertes par e-mail', Security: 'Sécurité',
  'Two-Factor Authentication': 'Authentification à deux facteurs', 'User Management': 'Gestion des utilisateurs',
  'Data Management': 'Gestion des données', Save: 'Enregistrer', Cancel: 'Annuler', Close: 'Fermer',
  Delete: 'Supprimer', Edit: 'Modifier', Add: 'Ajouter', 'Add New Schedule': 'Ajouter un nouvel horaire',
  'Select Class': 'Sélectionner une classe', 'Select time': 'Sélectionner une heure', Room: 'Salle',
  'Search by name, email, or class...': 'Rechercher par nom, e-mail ou classe…',
  'Search by name, email, or position...': 'Rechercher par nom, e-mail ou poste…',
  'Search by name, email, role, or status...': 'Rechercher par nom, e-mail, rôle ou statut…',
  'Enter student name': 'Saisissez le nom de l’étudiant', 'Enter staff name': 'Saisissez le nom du membre du personnel',
  'Your full name': 'Votre nom complet', 'Add your phone number': 'Ajoutez votre numéro de téléphone',
  'Announcement title': 'Titre de l’annonce', 'Write announcement details...': 'Rédigez le contenu de l’annonce…',
  'Create Announcement': 'Créer une annonce', 'Total Students:': 'Total des étudiants :', 'Total Staff:': 'Total du personnel :',
  'Total Accounts:': 'Total des comptes :', 'Total Announcements:': 'Total des annonces :', Total: 'Total',
  'Pending approvals': 'Approbations en attente', 'Latest Announcements': 'Dernières annonces',
  'Recent Activity': 'Activité récente', 'Getting Started': 'Pour commencer',
  'Use the sidebar menu to access different sections': 'Utilisez le menu latéral pour accéder aux différentes sections',
  'Use the sidebar menu to access different modules': 'Utilisez le menu latéral pour accéder aux différents modules',
  Navigate: 'Naviguer', Manage: 'Gérer', Organize: 'Organiser',
  'Add, edit, or remove records as needed': 'Ajoutez, modifiez ou supprimez des données selon vos besoins',
  'Keep your institution organized and up-to-date': 'Gardez votre établissement organisé et à jour',
  'No recent activity yet': 'Aucune activité récente',
  'Activity will appear here as you manage records': 'L’activité apparaîtra ici au fur et à mesure de la gestion des données',
  'No announcements yet': 'Aucune annonce pour le moment', 'Waiting for verification': 'En attente de vérification',
  'Waiting for approval': 'En attente d’approbation', 'Verification pending': 'Vérification en attente',
  'An administrator must verify your student account first': 'Un administrateur doit d’abord vérifier votre compte étudiant',
  'An administrator must verify your account and assign your class': 'Un administrateur doit vérifier votre compte et vous affecter une classe',
  'Your student account needs admin verification and a class assignment before dashboard access is available.': 'Votre compte étudiant doit être vérifié et affecté à une classe par un administrateur avant d’accéder au tableau de bord.',
  'Admins can assign or change your class and verify your account from the Accounts page inside the dashboard.': 'Les administrateurs peuvent vous affecter une classe ou la modifier, puis vérifier votre compte depuis la page Comptes du tableau de bord.',
  'Return to login': 'Retour à la connexion', 'Reset password': 'Réinitialiser le mot de passe',
  'Use an email code to secure your account': 'Utilisez un code reçu par e-mail pour sécuriser votre compte',
  'Check your email': 'Vérifiez votre e-mail', 'Reset Code': 'Code de réinitialisation',
  'New Password': 'Nouveau mot de passe', 'Confirm New Password': 'Confirmer le nouveau mot de passe',
  'Create student account': 'Créer un compte étudiant',
  'Verify your email, then wait for admin approval': 'Vérifiez votre e-mail, puis attendez l’approbation de l’administrateur',
  'Confirm Password': 'Confirmer le mot de passe', 'Verification Code': 'Code de vérification',
  'Email verified. Your account is waiting for admin approval.': 'E-mail vérifié. Votre compte est en attente d’approbation par un administrateur.',
  'View Status': 'Voir le statut', 'Please fill in all fields': 'Veuillez remplir tous les champs',
  'This account is not an admin account.': 'Ce compte n’est pas un compte administrateur.',
  'Invalid email, password, or secret code': 'E-mail, mot de passe ou code secret invalide',
  'Admin Access': 'Accès administrateur', 'Secure administrative login': 'Connexion sécurisée à l’administration',
  'Secret Code': 'Code secret', 'Demo Admin Credentials:': 'Identifiants administrateur de démonstration :',
  'Forgot password?': 'Mot de passe oublié ?', 'Create Student Account': 'Créer un compte étudiant',
  'Logging in...': 'Connexion en cours…', 'Verifying...': 'Vérification en cours…', Access: 'Accéder',
  'Signing you in': 'Connexion en cours', 'Google sign-in failed': 'Échec de la connexion avec Google',
  'Finishing your Google sign-in…': 'Finalisation de votre connexion Google…',
  'Your password has been reset.': 'Votre mot de passe a été réinitialisé.', 'Return to Login': 'Retour à la connexion',
  'Application data is stored in XAMPP MySQL database `int_app`.': 'Les données de l’application sont stockées dans la base MySQL `int_app` de XAMPP.',
  'Receive push notifications for important updates': 'Recevez des notifications push pour les mises à jour importantes',
  'Receive email notifications for events and changes': 'Recevez des e-mails pour les événements et les modifications',
  'Add an extra layer of security to your account': 'Ajoutez une couche de sécurité supplémentaire à votre compte',
  'Manage Account Verification': 'Gérer la vérification des comptes', 'Set User Permissions': 'Définir les autorisations des utilisateurs',
  External: 'Externe', All: 'Tous', Pending: 'En attente', Verified: 'Vérifié', Admin: 'Administrateur',
  Student: 'Étudiant', Active: 'Actif', Inactive: 'Inactif', Normal: 'Normale', High: 'Élevée', Low: 'Faible',
  'Please enter a valid email address.': 'Veuillez saisir une adresse e-mail valide.',
  'Something went wrong. Please try again.': 'Une erreur s’est produite. Veuillez réessayer.',
  'INT App is your comprehensive academic management system. Use the sidebar to navigate to different sections and manage your institution\'s data.': 'INT App est votre système complet de gestion scolaire. Utilisez le menu latéral pour accéder aux différentes sections et gérer les données de votre établissement.',
  'Academic Management System': 'Système de gestion scolaire',
  Password: 'Mot de passe', Login: 'Se connecter', 'Enter your password': 'Saisissez votre mot de passe',
  'Enter secret code': 'Saisissez le code secret', 'Add Student': 'Ajouter un étudiant', 'Edit Student': 'Modifier l’étudiant',
  'Add New Student': 'Ajouter un nouvel étudiant', Update: 'Mettre à jour', 'e.g., 10-A': 'Ex. : 10-A',
  'No students found': 'Aucun étudiant trouvé', 'Add Staff': 'Ajouter un membre du personnel',
  'Edit Staff Member': 'Modifier le membre du personnel', 'Add New Staff': 'Ajouter un membre du personnel',
  'e.g., Mathematics Teacher': 'Ex. : professeur de mathématiques', 'e.g., Science': 'Ex. : sciences',
  'No staff members found': 'Aucun membre du personnel trouvé', 'Add Classroom': 'Ajouter une salle de classe',
  'Edit Classroom': 'Modifier la salle', 'Occupied': 'Occupée', 'Edit Details': 'Modifier les détails',
  'Schedule Exam': 'Planifier un examen', Exam: 'Examen', 'Edit Exam': 'Modifier l’examen',
  'View Details': 'Voir les détails', Planned: 'Prévu', Scheduled: 'Planifié', Completed: 'Terminé',
  to: 'au', classes: 'classes', 'No accounts found': 'Aucun compte trouvé', Account: 'Compte',
  Verify: 'Vérifier', Reject: 'Refuser', pending: 'en attente', verified: 'vérifié', rejected: 'refusé',
  student: 'Étudiant', prof: 'Professeur', staff: 'Personnel', admin: 'Administrateur', 'Add Schedule': 'Ajouter un cours',
  'sessions scheduled': 'cours planifiés', Monday: 'Lundi', Tuesday: 'Mardi', Wednesday: 'Mercredi',
  Thursday: 'Jeudi', Friday: 'Vendredi', 'Teacher name': 'Nom de l’enseignant', 'e.g., Mathematics': 'Ex. : mathématiques',
  'e.g., 101': 'Ex. : 101', 'Create New Announcement': 'Créer une annonce', 'Edit Announcement': 'Modifier l’annonce',
  Announcement: 'Annonce', Create: 'Créer', Parents: 'Parents', Medium: 'Moyenne',
  'Account moderation is only available to verified admin users.': 'La gestion des comptes est réservée aux administrateurs vérifiés.',
  'Admin review': 'Vérification par un administrateur', Schedule: 'Planifier',
  'Account information saved successfully.': 'Les informations du compte ont été enregistrées.',
  'Unable to save account information.': 'Impossible d’enregistrer les informations du compte.',
  'Save Changes': 'Enregistrer les modifications', 'Saving...': 'Enregistrement…',
  'Please enter your email address.': 'Veuillez saisir votre adresse e-mail.',
  'No account was found with this email address.': 'Aucun compte ne correspond à cette adresse e-mail.',
  'Unable to send verification code.': 'Impossible d’envoyer le code de vérification.',
  'Unable to send reset code.': 'Impossible d’envoyer le code de réinitialisation.',
  'Unable to verify code.': 'Impossible de vérifier le code.',
  'Unable to reset password.': 'Impossible de réinitialiser le mot de passe.',
  'Enter the verification code sent to your email.': 'Saisissez le code de vérification envoyé par e-mail.',
  'Invalid verification code.': 'Code de vérification invalide.', 'Invalid reset code.': 'Code de réinitialisation invalide.',
  'Password must be at least 6 characters.': 'Le mot de passe doit contenir au moins 6 caractères.',
  'Passwords do not match.': 'Les mots de passe ne correspondent pas.',
  'An account with this email already exists.': 'Un compte associé à cette adresse e-mail existe déjà.',
  'Your account is waiting for admin verification.': 'Votre compte est en attente de vérification par un administrateur.',
  'This account was rejected. Please contact the administrator.': 'Ce compte a été refusé. Veuillez contacter l’administrateur.',
  'Unable to send email.': 'Impossible d’envoyer l’e-mail.', 'Unable to send email with Gmail SMTP.': 'Impossible d’envoyer l’e-mail via Gmail SMTP.',
  'Email provider rejected the request.': 'Le fournisseur de messagerie a refusé la demande.',
  'Please fill in all fields.': 'Veuillez remplir tous les champs.',
  'We sent a 6-digit code to': 'Nous avons envoyé un code à 6 chiffres à',
  'We sent a password reset code to': 'Nous avons envoyé un code de réinitialisation à',
  'Development Code': 'Code de développement', 'Enter 6-digit code': 'Saisissez le code à 6 chiffres',
  'Sending code...': 'Envoi du code…', 'Send Verification Code': 'Envoyer le code de vérification',
  'Send Reset Code': 'Envoyer le code de réinitialisation', 'Verify and Create Account': 'Vérifier et créer le compte',
  'Send another code': 'Renvoyer un code', 'Back to login': 'Retour à la connexion',
  'Enter your full name': 'Saisissez votre nom complet', 'Create a password': 'Créez un mot de passe',
  'Confirm your password': 'Confirmez votre mot de passe', 'Create a new password': 'Créez un nouveau mot de passe',
  'Confirm your new password': 'Confirmez votre nouveau mot de passe', 'Reset Password': 'Réinitialiser le mot de passe',
  'Resetting...': 'Réinitialisation…', 'Continue with Google': 'Continuer avec Google',
  'Sign up with Google': 'S’inscrire avec Google', 'Connecting to Google…': 'Connexion à Google…', or: 'ou',
  'Google sign-in needs the Supabase URL and anon key configured.': 'La connexion Google nécessite la configuration de l’URL Supabase et de la clé publique.',
  'Google sign-in is not enabled for this Supabase project yet.': 'La connexion Google n’est pas encore activée pour ce projet Supabase.',
  'Unable to start Google sign-in.': 'Impossible de démarrer la connexion Google.',
  'Google did not return a valid sign-in session. Please try again.': 'Google n’a pas renvoyé de session valide. Veuillez réessayer.',
  'Unable to finish Google sign-in.': 'Impossible de terminer la connexion Google.',
  'Your account was created as a student account. You can sign in after an admin marks it as verified.': 'Votre compte étudiant a été créé. Vous pourrez vous connecter après sa vérification par un administrateur.',
  'Admins can verify accounts and adjust roles from the Accounts page inside the dashboard.': 'Les administrateurs peuvent vérifier les comptes et modifier les rôles depuis la page Comptes du tableau de bord.',
  'The verification code expired. Please request a new one.': 'Le code de vérification a expiré. Veuillez en demander un nouveau.',
  'Invalid email or password.': 'Adresse e-mail ou mot de passe invalide.', 'Unable to create account.': 'Impossible de créer le compte.',
  'Unable to load data.': 'Impossible de charger les données.', 'Unable to save data.': 'Impossible d’enregistrer les données.',
  'Unable to delete data.': 'Impossible de supprimer les données.', 'Student account': 'Compte étudiant',
  'Resource': 'Ressource', 'Timetable entry': 'Élément d’emploi du temps', 'created': 'créé', 'updated': 'mis à jour',
  'deleted': 'supprimé',
};

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (text: string) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

function applyDocumentLanguage(language: Language) {
  document.documentElement.lang = language;
  document.title = language === 'fr' ? 'INT App - Gestion scolaire' : 'INT App - Academic Management System';
  const description = document.querySelector('meta[name="description"]');
  description?.setAttribute(
    'content',
    language === 'fr'
      ? 'Système de gestion scolaire pour les étudiants, le personnel, les emplois du temps et les annonces.'
      : 'Modern academic management system for institutes to manage students, staff, schedules, and announcements',
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    let stored: string | null = null;
    try { stored = window.localStorage.getItem('int-app-language'); } catch { /* Storage may be disabled. */ }
    const initialLanguage: Language = stored === 'fr' ? 'fr' : 'en';
    setLanguageState(initialLanguage);
    applyDocumentLanguage(initialLanguage);
  }, []);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    applyDocumentLanguage(nextLanguage);
    try { window.localStorage.setItem('int-app-language', nextLanguage); } catch { /* Keep it for this session. */ }
  }, []);
  const t = useCallback((text: string) => {
    if (language === 'fr') return french[text] ?? text;
    return text === 'prof' ? 'Professor' : text;
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
