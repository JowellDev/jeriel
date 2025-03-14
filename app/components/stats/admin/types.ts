export interface MembersStats {
	id: string
	name: string
	createdAt: Date | string
	monthAttendanceResume: number | null
	sundays: number
	monthStatistcs: {
		sunday: Date | string
		churchPresence: boolean | null
		meetingPresence: boolean | null
	}[]
}
