export const classSections = [
  {
    level: 'BTS',
    programs: [
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
    ],
  },
  {
    level: 'BTP',
    programs: [
      'Informatique de Gestion',
      'Multimédia',
      'Comptable d’Entreprise',
      'Formalités Douanières',
      'Maintenance Microsystèmes Informatiques',
      'Secrétariat',
      'Décoration et Design d’Intérieur',
    ],
  },
  {
    level: 'CAP',
    programs: ['Vendeur Caissier'],
  },
] as const;

export type DiplomaLevel = (typeof classSections)[number]['level'];

export const classYearOptions = ['1ère année', '2ème année'] as const;

export const classSectionOptions: string[] = classSections.flatMap(({ level, programs }) =>
  programs.flatMap((program) =>
    level === 'CAP'
      ? [`${level} ${program}`]
      : classYearOptions.map((year) => `${level} ${program} - ${year}`),
  ),
);

export function getDiplomaLevel(className: string): DiplomaLevel | null {
  return classSections.find(({ level }) => className.startsWith(`${level} `))?.level ?? null;
}
