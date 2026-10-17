const finishedStatuses = new Set(['COMPLETED', 'FAILED']);

function timestamp(value) {
  const parsed = new Date(value || 0).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function newestFirst(left, right) {
  return timestamp(right.completed_date || right.scheduled_date) -
    timestamp(left.completed_date || left.scheduled_date) ||
    Number(right.inspection_id || 0) - Number(left.inspection_id || 0);
}

export function getApplicationInspection(assignments, inspections, applicationId) {
  const appAssignments = assignments.filter(
    (assignment) => Number(assignment.application_id) === Number(applicationId),
  );
  const assignmentIds = new Set(appAssignments.map((assignment) => Number(assignment.assignment_id)));
  const appInspections = inspections
    .filter((inspection) => assignmentIds.has(Number(inspection.assignment_id)))
    .sort(newestFirst);
  const report = appInspections
    .filter((inspection) => finishedStatuses.has(String(inspection.status).toUpperCase()))
    .sort(newestFirst)[0];
  const assignment = report
    ? appAssignments.find((row) => Number(row.assignment_id) === Number(report.assignment_id))
    : [...appAssignments].sort((left, right) =>
      timestamp(right.assigned_at) - timestamp(left.assigned_at) ||
      Number(right.assignment_id) - Number(left.assignment_id),
    )[0];
  const inspection = report || (assignment
    ? appInspections.find((row) => Number(row.assignment_id) === Number(assignment.assignment_id))
    : undefined);

  return { assignment, inspection };
}

export function applicationWorkflowStatus(application, review, inspection) {
  if (review?.status) return review.status;
  const result = String(inspection?.status || '').toUpperCase();
  if (result === 'COMPLETED') return 'Inspection completed';
  if (result === 'FAILED') return 'Inspection failed';
  return application?.application_status || 'Pending';
}
