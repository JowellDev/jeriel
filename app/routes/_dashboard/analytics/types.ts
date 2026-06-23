import type { Gender, MaritalStatus } from '@prisma/client'
import type { EntityType } from '~/helpers/authorized-entities.server'

export type { EntityType }

/** Entité résolue dans le scope (toujours nommée). */
export interface ScopeEntity {
	type: EntityType
	id: string
	name: string
}

/**
 * Périmètre d'analyse résolu côté serveur.
 * - `selectedEntity = null` => admin, vue église entière.
 */
export interface AnalyticsScope {
	isAdmin: boolean
	churchId: string | null
	selectedEntity: ScopeEntity | null
	entities: ScopeEntity[]
	label: string
}

/** Membre chargé une seule fois et partagé entre les calculs de métriques. */
export interface ScopedMember {
	id: string
	name: string
	email: string | null
	phone: string | null
	pictureUrl: string | null
	gender: Gender | null
	maritalStatus: MaritalStatus | null
	birthday: Date | null
	createdAt: Date
	tribeId: string | null
	departmentId: string | null
	honorFamilyId: string | null
}

export interface DistributionItem {
	label: string
	value: number
}

export interface MonthlyGrowthItem {
	month: string
	count: number
}

export interface OverviewMetrics {
	totalMembers: number
	newMembers: number
	oldMembers: number
	growthDelta: number
	genderDistribution: DistributionItem[]
	ageDistribution: DistributionItem[]
	maritalDistribution: DistributionItem[]
	monthlyGrowth: MonthlyGrowthItem[]
}

export interface AtRiskMember {
	id: string
	name: string
	phone: string | null
	lastSeen: string | null
	missedCount: number
}

export type HeatmapCell = boolean | null

export interface HeatmapRow {
	id: string
	name: string
	cells: HeatmapCell[]
}

export interface EntityRanking {
	id: string
	type: EntityType
	name: string
	rate: number
	memberCount: number
}

export interface AttendanceMetrics {
	attendanceRate: number
	rateDelta: number | null
	presentCount: number
	absentCount: number
	atRiskCount: number
	atRiskMembers: AtRiskMember[]
	sundays: string[]
	heatmap: HeatmapRow[]
	ranking: EntityRanking[]
}

export interface ReportRow {
	id: string
	type: EntityType
	name: string
	submitted: boolean
	submittedAt: string | null
}

export interface ReportMetrics {
	submissionRate: number
	submittedCount: number
	totalExpected: number
	lateCount: number
	entities: ReportRow[]
}

export interface IncompleteMember {
	id: string
	name: string
	missing: string[]
}

export interface DataQualityMetrics {
	incompleteCount: number
	unassignedCount: number
	completenessRate: number
	missingBreakdown: DistributionItem[]
	incompleteMembers: IncompleteMember[]
	unassignedMembers: { id: string; name: string }[]
}

export interface EngagementMember {
	id: string
	name: string
	score: number
	pictureUrl: string | null
}

export interface EngagementMetrics {
	average: number
	topMembers: EngagementMember[]
	lowMembers: EngagementMember[]
}

export interface BirthdayMember {
	id: string
	name: string
	phone: string | null
	day: string
	turning: number | null
}

/** Comptes légers exposés en widgets d'alerte sur le tableau de bord. */
export interface AlertCounts {
	atRiskCount: number
	lateReportsCount: number
	incompleteCount: number
}
