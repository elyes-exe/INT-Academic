export type DiplomaCode = 'BTS' | 'BTP' | 'CAP';

export type AcademicSectionSeed = {
  diplomaCode: DiplomaCode;
  code: string;
  name: string;
  /** Existing class label stem, retained so current student assignments still resolve. */
  classProgram: string;
  studyYears: readonly number[];
  active: boolean;
  subjectGroups: readonly { category: string; subjects: readonly string[] }[];
};

const splitSubjects = (subjects: string) => subjects.split('|').map((subject) => subject.trim()).filter(Boolean);
const programme = (subjects: string) => [{ category: 'Programme', subjects: splitSubjects(subjects) }];
const generalAudiovisual = splitSubjects(
  'Culture entrepreneuriale|Droit et devoir de citoyen|Français|Arabe|Anglais|Culture de santé et de sécurité au travail|Culture numérique|Culture environnementale et maîtrise de l’énergie',
);
const audiovisualGroups = (specific: string) => [
  { category: 'Compétences spécifiques', subjects: splitSubjects(specific) },
  { category: 'Enseignement Général', subjects: generalAudiovisual },
];

export const academicDiplomas = [
  { code: 'BTS', name: 'Brevet de Technicien Supérieur' },
  { code: 'BTP', name: 'Brevet de Technicien Professionnel' },
  { code: 'CAP', name: 'Certificat d’Aptitude Professionnelle' },
] as const;

export const academicSectionSeeds: AcademicSectionSeed[] = [
  {
    diplomaCode: 'BTS', code: 'bts-comptabilite-finance', name: 'Comptabilité et Finance',
    classProgram: 'Comptabilité & Finance', studyYears: [1, 2], active: true,
    subjectGroups: programme('Technique comptable|Législation commerciale|Comptabilisation des opérations courantes|Opérations financières|Organisation du travail|Documents commerciaux|Logiciels de gestion|Déclarations fiscales mensuelles|Travaux d’inventaire|Déclarations fiscales annuelles|Budgets prévisionnels|Analyse financière|Comptabilité particulière|Gestion de société|Stage d’initiation|Stage de perfectionnement'),
  },
  {
    diplomaCode: 'BTS', code: 'bts-multimedia', name: 'Multimédia / Contenus Multimédias',
    classProgram: 'Contenus Multimédias', studyYears: [1, 2], active: true,
    subjectGroups: programme('Internet|Commerce électronique|Technologie de la communication|Architecture des systèmes informatiques|Applications bureautiques|Systèmes d’exploitation|Systèmes d’exploitation réseau|Cryptographie et sécurité des données informatiques|Algorithmique et structures de données|Conception orientée objet|Interface Homme-Machine|Gestion des projets|Gestionnaire de bases de données|Langage de programmation orienté objet|Langage de scripts|HTML|Logiciels auteurs|Animation 2D et ActionScript|Modélisation et animation 3D|Programmation HTML|Traitement vidéo|Traitement du son|Traitement de l’image|Expression plastique|Arabe|Français|Anglais|Législation, hygiène, santé et sécurité|Stage d’observation|Stage d’intégration|Projet'),
  },
  {
    diplomaCode: 'BTS', code: 'bts-reseaux-securite', name: 'Réseaux et Sécurité Informatique',
    classProgram: 'Réseau et Sécurité Informatique', studyYears: [1, 2], active: true,
    subjectGroups: programme('Sécurité des réseaux|Réseaux locaux|Systèmes d’exploitation réseaux|Administration des réseaux|Systèmes électroniques numériques|Systèmes électroniques analogiques|Électricité et électromagnétisme|Circuits à semi-conducteurs|Algorithmique et structures de données|Architecture des systèmes informatiques et réseaux|Microprocesseurs|Programmation des microcontrôleurs|Interconnexion des réseaux|Ingénierie de câblage informatique|Réseaux sans fil|JavaScript|Gestion d’entreprise|Français|Anglais|Arabe|Sécurité et législation du travail|Réseaux étendus|Cloud Computing|Projet de fin de formation'),
  },
  {
    diplomaCode: 'BTS', code: 'bts-informatique-gestion', name: 'Informatique de Gestion',
    classProgram: 'Informatique de Gestion', studyYears: [1, 2], active: true,
    subjectGroups: programme('Mathématiques / Algèbre linéaire|Architecture et fonctionnement des ordinateurs|Installation des composants matériels et logiciels|Systèmes d’exploitation (Windows / Linux)|Logiciels bureautiques|Langage de programmation C++|Langage de programmation Java|Administration des réseaux|Internet|Sécurité informatique|Gestion de projets informatiques|Gestion d’un parc informatique|Progiciels de gestion|Analyse informatique|Conception de bases de données|SGBD et SQL|Statistiques|Comptabilité|Anglais|Français et techniques de communication|Arabe|Droit du travail|Hygiène, santé et sécurité|Projet|Stage d’observation|Stage d’intégration'),
  },
  {
    diplomaCode: 'BTS', code: 'bts-commerce-international', name: 'Commerce International',
    classProgram: 'Commerce international', studyYears: [1, 2], active: true,
    subjectGroups: programme('Gestion comptable et financière|Calculs financiers|Réglementation du commerce|Marketing national|Transactions commerciales|Importation|Exportation|Dédouanement des marchandises|Approvisionnements|Marketing international|Réglementation du commerce international|Gestion du risque de change|Anglais commercial|Bases de données|Logiciels de gestion commerciale|Internet|Qualité|Législation et sécurité du travail|Arabe|Français|Anglais|Projet|Stages'),
  },
  {
    diplomaCode: 'BTS', code: 'bts-logistique-distribution', name: 'Logistique de Distribution',
    classProgram: 'Logistique de Distribution', studyYears: [1, 2], active: true,
    subjectGroups: programme('Gestion comptable et financière|Économie globale|Logistique de production|Introduction au transport|Géographie nationale et internationale du transport|Droit du transport|Contrats et assurances|Douane et accords internationaux|Management des entreprises|Management d’équipe|Gestion des besoins de transport|Gestion des transports externes|Gestion des stocks|Manutention et entreposage|Gestion des mouvements de produits|Anglais du transport et de la logistique|Informatique et Internet|Législation du travail|Arabe|Français|Anglais|Projet|Stages'),
  },
  {
    diplomaCode: 'BTS', code: 'bts-audiovisuel-assistant-realisateur', name: 'Audiovisuel – Option Assistant Réalisateur',
    classProgram: 'Audiovisuel - Assistant Réalisateur', studyYears: [1, 2], active: true,
    subjectGroups: audiovisualGroups('Technique de cinéma|Prise de vue|Tournage|Fonction de travail et démarche de la formation|Histoire du cinéma|Documentaire|Prise de son|Éclairage|Analyse filmique|Communication|Élaborer le dépouillement général d’un projet audiovisuel|Montage|Conception d’émission|Repérage|Casting|Régie studio|Scénario|Direction d’acteur|Dramaturgie|Économie de cinéma|Dessin artistique'),
  },
  {
    diplomaCode: 'BTS', code: 'bts-audiovisuel-montage', name: 'Audiovisuel – Option Montage',
    classProgram: 'Audiovisuel - Montage', studyYears: [1, 2], active: true,
    subjectGroups: audiovisualGroups('Le montage linéaire et le montage non linéaire|Montage et effets spéciaux|Utilisation des logiciels de montage|Initiation à la prise de vue|Découverte de la profession et de la démarche de formation|Montage d’un produit audiovisuel|Documentaire|La Lumière|Technique son|Utiliser l’outil informatique|Initiation à la réalisation|Langage cinématographique|Les fonctions du montage|L’étalonnage|Initiation à l’assistanat|Gestion de la production|La Dramaturgie|Technique VFX|Signal vidéo|Musique cinématographique|Écriture scénaristique|Droit de l’audiovisuel'),
  },
  {
    diplomaCode: 'BTS', code: 'bts-audiovisuel-prise-vue', name: 'Audiovisuel – Option Prise de Vue',
    classProgram: 'Audiovisuel - Prise de Vue', studyYears: [1, 2], active: true,
    subjectGroups: audiovisualGroups('Prise de vue|La photographie|Traitement d’image numérique|Machinerie et équipements audiovisuels|Découverte de la profession et de la démarche de formation|Histoire de l’art et du cinéma|La Lumière|Technique son|Analyse filmique|Utiliser l’outil informatique|Postproduction|Colorimétrie|Initiation à la réalisation|Langage cinématographique|Technique caméra|Signal vidéo|Écriture scénaristique|Direction d’acteur|Droit de l’audiovisuel|Initiation à la dramaturgie|Gestion de la production'),
  },
  {
    diplomaCode: 'BTS', code: 'bts-audiovisuel-prise-son', name: 'Audiovisuel – Option Prise de Son',
    classProgram: 'Audiovisuel - Prise de Son', studyYears: [1, 2], active: true,
    subjectGroups: audiovisualGroups('Technique son|Montage et effets spéciaux|Acoustique|Initiation à la prise de vue|Découverte de la profession et de la démarche de formation|Histoire du cinéma|Installation et interconnexion des équipements sonores|Lumière|Utiliser l’outil informatique|Analyse filmique|Montage son et post-synchronisation|Initiation à la réalisation|Langage cinématographique|Nouvelles technologies d’exploitation audiovisuelle|Mixage et postproduction|Traitement du signal|Prise de son en studio|Signal vidéo|Musique cinématographique|Écriture scénaristique|Droit de l’audiovisuel|Physique appliquée'),
  },
  {
    diplomaCode: 'BTS', code: 'bts-assistant-direction', name: 'Assistant de direction',
    classProgram: 'Assistant de direction', studyYears: [1, 2], active: true,
    subjectGroups: [],
  },
  {
    diplomaCode: 'BTP', code: 'btp-comptabilite-entreprise', name: 'Comptabilité d’Entreprise',
    classProgram: 'Comptable d’Entreprise', studyYears: [1, 2], active: true,
    subjectGroups: programme('Architecture et installation des composants informatiques|Algorithmique et structures de données|Administration des données|Progiciels de gestion|Gestion informatique|Sécurité informatique|Maintenance informatique|Gestion d’un parc informatique|Développement d’applications locales simples|Administration des réseaux|Gestion|Arabe|Français|Anglais|Législation, hygiène et sécurité du travail|Projet|Stages'),
  },
  {
    diplomaCode: 'BTP', code: 'btp-maintenance-microsystemes', name: 'Maintenance de Microsystèmes Informatiques',
    classProgram: 'Maintenance Microsystèmes Informatiques', studyYears: [1, 2], active: true,
    subjectGroups: programme('Architecture des ordinateurs|Composants et périphériques informatiques|Assemblage et configuration des PC|Électricité et électromagnétisme|Circuits électroniques|Microprocesseurs|Programmation des microcontrôleurs|Systèmes d’exploitation|Applications bureautiques|Réseaux informatiques|Installation et configuration des réseaux|Maintenance informatique|Dépannage matériel|Assistance technique|Optimisation des équipements|Projet|Stages'),
  },
  {
    diplomaCode: 'BTP', code: 'btp-formalites-douanieres', name: 'Formalités Douanières',
    classProgram: 'Formalités Douanières', studyYears: [1, 2], active: true,
    subjectGroups: programme('Transport et Incoterms|Opérations d’importation|Gestion comptable et financière|Réglementations douanières|Paiement international|Nomenclature douanière|Informatique et Internet|Droit du travail|Français|Organisation de l’administration des douanes|Procédures douanières|Déclaration en détail|Formalités douanières|Logiciels de gestion|Droit commercial|Anglais commercial|Arabe|Stage'),
  },
  {
    diplomaCode: 'BTP', code: 'btp-soutien-informatique-gestion', name: 'Soutien en Informatique de Gestion',
    classProgram: 'Informatique de Gestion', studyYears: [1, 2], active: true,
    subjectGroups: programme('Architecture et installation des composants informatiques|Algorithmique et structures de données|Faire une présentation orale|Administrer des données|Assurer le fonctionnement d’un progiciel de gestion|Travailler en équipe|Effectuer des recherches d’information|Rédiger des documents|Assurer des séances de formation|Mettre en œuvre des mesures de sécurité|Prendre en charge des pannes|Réaliser des activités commerciales|Gérer un parc informatique|Participer au développement d’applications locales simples|Assister l’administrateur d’un réseau|Projet|S’initier à la vie professionnelle|S’intégrer au marché du travail|Gestion|Arabe|Français|Anglais'),
  },
  {
    diplomaCode: 'BTP', code: 'btp-technicien-multimedia', name: 'Technicien en Multimédia',
    classProgram: 'Multimédia', studyYears: [1, 2], active: true,
    subjectGroups: programme('Architecture des systèmes informatiques|Systèmes d’exploitation|Applications bureautiques|Conception de maquettes|Cryptographie et sécurité des données|Algorithmique et structures de données|Conception orientée objet|Ergonomie des interfaces|Bases de données|Programmation orientée objet|HTML|Traitement de l’image|Dessin vectoriel|Traitement du son|Animation 2D|Conception interactive|Programmation web dynamique|Mise en page professionnelle|Traitement vidéo|Modélisation et animation 3D|Java|Systèmes de gestion de contenu|Stages'),
  },
  {
    diplomaCode: 'BTP', code: 'btp-decoration-design-interieur', name: 'Décoration et Design d’Intérieur',
    classProgram: 'Décoration et Design d’Intérieur', studyYears: [1, 2], active: true,
    subjectGroups: programme('Dessin d’observation|Dessin technique|Esthétique et histoire de l’art|Histoire des styles et du design d’intérieur|Langage visuel|Théorie et pratique de la couleur|Mobilier contemporain|Organisation bidimensionnelle|Dessin architectural|Dessin assisté par ordinateur|Design d’intérieur|Maquettes|Créativité et résolution de problèmes|Matériaux et finitions|Architecture environnementale|Design et fabrication de mobilier|Dessin et rendu|Éclairage|Organisation tridimensionnelle|Design d’intérieurs commerciaux|Design d’intérieurs institutionnels|Mobilier et accessoires|Pratique professionnelle|Rendu et présentation|Culture entrepreneuriale|Droit et devoir du citoyen|Français|Arabe|Anglais|Santé et sécurité au travail|Culture numérique|Culture environnementale et maîtrise de l’énergie'),
  },
  {
    diplomaCode: 'BTP', code: 'btp-secretariat', name: 'Secrétariat',
    classProgram: 'Secrétariat', studyYears: [1, 2], active: true,
    subjectGroups: [],
  },
  {
    diplomaCode: 'CAP', code: 'cap-vendeur-caissier-etalagiste', name: 'Vendeur Caissier Étalagiste',
    classProgram: 'Vendeur Caissier', studyYears: [0], active: true,
    subjectGroups: programme('Gestion de base|Gestion des stocks|Types de produits|Calcul commercial|Documents commerciaux|Aménagement de la surface de vente|Informatique|Comportement du client|Marketing|Techniques de vente|Comptabilité générale|Moyens de paiement|Gestion de caisse|Recherche d’emploi|Gestion d’entreprise|Législation|Gestion de la qualité|Éducation environnementale|Anglais|Français|Arabe'),
  },
];

export const initialAcademicYear = '2026-2027';
