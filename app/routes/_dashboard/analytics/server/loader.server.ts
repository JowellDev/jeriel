import { type LoaderFunctionArgs } from '@remix-run/node'
import { gatherAnalyticsInputs } from './gather.server'
import {
	buildOverviewMetrics,
	buildUpcomingBirthdays,
} from './metrics/overview.server'
import { buildAttendanceMetrics } from './metrics/attendance.server'
import { buildDataQualityMetrics } from './metrics/data-quality.server'
import { buildEngagementMetrics } from './metrics/engagement.server'
import { buildReportMetrics } from './metrics/reports.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const inputs = await gatherAnalyticsInputs(request)
	const { members, scope, from, to, previousFrom, previousTo } = inputs

	const reports = await buildReportMetrics(scope, from, to)

	return {
		user: { name: inputs.user.name, roles: inputs.user.roles },
		scope,
		filter: inputs.filter,
		overview: buildOverviewMetrics(members, from, to, previousFrom, previousTo),
		attendance: buildAttendanceMetrics({
			members,
			currentAttendances: inputs.currentAttendances,
			previousAttendances: inputs.previousAttendances,
			periodSundays: inputs.periodSundays,
			recentSundays: inputs.recentSundays,
			rankingEntities: inputs.rankingEntities,
		}),
		dataQuality: buildDataQualityMetrics(members, scope.isAdmin),
		engagement: buildEngagementMetrics(
			members,
			inputs.currentAttendances,
			inputs.periodSundays,
			to,
		),
		reports,
		birthdays: buildUpcomingBirthdays(members, to),
	}
}

export type LoaderType = typeof loaderFn
