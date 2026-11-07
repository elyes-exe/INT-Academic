export const classYearOptions = ['1ère année', '2ème année'] as const;

function diplomaClasses(level: 'BTS' | 'BTP', programs: readonly string[]) {
  return programs.flatMap((program) =>
    classYearOptions.map((year) => `${level} ${program} - ${year}`),
  );
}

export const classSections = [
  {
    level: 'BTS',
    classes: diplomaClasses('BTS', [
      'Réseau et Sécurité Informatique',
      'Audiovisuel - Prise de Son',
      'Audiovisuel - Prise de Vue',
      'Audiovisuel - Montage',
      'Audiovisuel - Assistant Réalisateur',
      'Assistant de direction',
      'Informatique de Gestion',
      'Développement Web',
      'Contenus Multimédias',
      'Commerce international',
      'Comptabilité & Finance',
      'Logistique de Distribution',
    ]),
  },
  {
    level: 'BTP',
    classes: diplomaClasses('BTP', [
      'Informatique de Gestion',
      'Multimédia',
      'Comptable d’Entreprise',
      'Formalités Douanières',
      'Maintenance Microsystèmes Informatiques',
      'Secrétariat',
      'Décoration et Design d’Intérieur',
    ]),
  },
  {
    level: 'CAP',
    classes: ['CAP Vendeur Caissier'],
  },
  {
    level: 'Labo',
    classes: Array.from({ length: 15 }, (_, index) => `Labo ${index + 1}`),
  },
  {
    level: 'ST',
    classes: Array.from({ length: 12 }, (_, index) => `ST${index + 1}`),
  },
] as const;

export type DiplomaLevel = (typeof classSections)[number]['level'];

export const classSectionOptions: string[] = classSections.flatMap(({ classes }) => [...classes]);

export function getDiplomaLevel(className: string): DiplomaLevel | null {
  return classSections.find(({ classes }) => (classes as readonly string[]).includes(className))?.level ?? null;
}
