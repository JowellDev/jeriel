/**
 * Nombre de dimanches consécutifs sans présence à partir duquel un membre
 * est considéré « à risque » d'absentéisme.
 */
export const AT_RISK_SUNDAYS = 4

/** Onglets de la page Analytique (pilotés par le query param `?tab=`). */
export const ANALYTICS_TABS = [
	'overview',
	'attendance',
	'reports',
	'quality',
] as const

export type AnalyticsTab = (typeof ANALYTICS_TABS)[number]

/** Jeux de données exportables en Excel. */
export const EXPORT_DATASETS = ['at-risk', 'attendance', 'incomplete'] as const

export type ExportDataset = (typeof EXPORT_DATASETS)[number]

/**
 * Pondérations du score d'engagement (somme = 1).
 * - presence  : assiduité aux cultes sur la période.
 * - tenure    : ancienneté du membre.
 * - profile   : complétude de la fiche.
 */
export const ENGAGEMENT_WEIGHTS = {
	presence: 0.6,
	tenure: 0.2,
	profile: 0.2,
} as const

/** Ancienneté (en mois) au-delà de laquelle le score d'ancienneté est maximal. */
export const TENURE_MAX_MONTHS = 24

/** Tranches d'âge utilisées pour la répartition démographique. */
export const AGE_BUCKETS: { label: string; min: number; max: number }[] = [
	{ label: '0-17 ans', min: 0, max: 17 },
	{ label: '18-25 ans', min: 18, max: 25 },
	{ label: '26-35 ans', min: 26, max: 35 },
	{ label: '36-50 ans', min: 36, max: 50 },
	{ label: '51+ ans', min: 51, max: 200 },
]

/** Champs vérifiés pour la qualité des fiches membres. */
export const PROFILE_FIELDS: { key: ProfileFieldKey; label: string }[] = [
	{ key: 'pictureUrl', label: 'Photo' },
	{ key: 'phone', label: 'Téléphone' },
	{ key: 'email', label: 'Email' },
	{ key: 'birthday', label: 'Date de naissance' },
	{ key: 'gender', label: 'Sexe' },
]

export type ProfileFieldKey =
	| 'pictureUrl'
	| 'phone'
	| 'email'
	| 'birthday'
	| 'gender'

/** Taille maximale des listes « top » affichées (à risque, engagement, etc.). */
export const TOP_LIST_LIMIT = 12

/** Nombre maximal de lignes dans la heatmap d'assiduité (les plus à risque d'abord). */
export const HEATMAP_MEMBER_LIMIT = 40
